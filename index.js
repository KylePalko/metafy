const proxy = (obj = {}, path = [], originalObj = null) => {

    if (typeof obj !== 'object') {
        throw `obj-type-non-object`
    }

    if (typeof obj.$meta === 'undefined' && originalObj === null) {
        obj.$meta = {
            'frozen': [],
            'type-locked': []
        }
    }

    return new Proxy(obj, {

        get: function (target, property) {

            const value = target[property]
            const _path = [ ...path, property ]

            if (originalObj === null) {
                originalObj = obj
            }

            /*
             * Determine if the user is trying to call $freeze() or $lock() and return the
             * corresponding function so it is invoked.
             */
            switch(property) {
                case '$freeze':
                    return freeze(_path, originalObj.$meta)
                case '$lock':
                    return lock(_path, originalObj.$meta)
                case '$meta':
                    throw 'meta-is-reserved-property'
            }

            /*
             * Proxy methods ($lock and $freeze) are added to primitive types and functions.
             * e.g., a user can call .$lock() and .$freeze() on a string.
             */
            switch(typeof value) {
                case 'object':
                    return proxy(value, [ ...path, property ], originalObj)
                case 'string':
                    return createProxyString(_path, originalObj.$meta, value)
                case 'number':
                    return createProxyNumber(_path, originalObj.$meta, value)
                case 'boolean':
                    return createProxyBoolean(_path, originalObj.$meta, value)
                case 'function':
                    return addProxyMethodsToFunction(_path, originalObj.$meta, value)
                default:
                    return value
            }
        },

        set: function (target, property, value) {

            const _path = [ ...path, property ]

            if (originalObj === null) {
                originalObj = obj
            }

            if (isFrozen(_path, originalObj.$meta)) {
                throw `property-frozen`
            } else if (isTypeLocked(_path, originalObj.$meta) && typeof value !== typeof target[property]) {
                throw `property-type-locked`
            }

            target[property] = value
        }
    })
}

const freeze = (path, $meta) => {

    if (path.length === 0) {
        throw `root-cannot-be-frozen`
    }

    $meta['frozen'] = [
        ...$meta['frozen'],
        path.slice(0, path.length).join('.')
    ]
}

const lock = (path, $meta) => {

    if (path.length === 0) {
        throw `root-cannot-be-type-locked`
    }

    $meta['type-locked'] = [
        ...$meta['type-locked'],
        path.slice(0, path.length).join('.')
    ]
}

const isFrozen = (path, $meta) => {

    for (let i = 0; i < path.length; i++) {
        const isMatch = $meta['frozen'].find((p) => p === path.slice(0, i + 1).join('.')) !== undefined

        if (isMatch) {
            return true
        }
    }

    return false
}

const isTypeLocked = (path, $meta) => {

    for (let i = 0; i < path.length; i++) {
        const isMatch = $meta['type-locked'].find((p) => p === path.slice(0, i + 1).join('.')) !== undefined

        if (isMatch) {
            return true
        }
    }

    return false
}

const createProxyString = (path, $meta, value) => {

    const ProxyString = class extends String {
        $freeze() {
            freeze(path, $meta)
        }
        $lock() {
            lock(path, $meta)
        }
    }

    return new ProxyString(value)
}

const createProxyBoolean = (path, $meta, value) => {

    const ProxyBoolean = class extends Boolean {
        $freeze() {
            freeze(path, $meta)
        }
        $lock() {
            lock(path, $meta)
        }
    }

    return new ProxyBoolean(value)
}

const createProxyNumber = (path, $meta, value) => {

    const ProxyNumber = class extends Number {
        $freeze() {
            freeze(path, $meta)
        }
        $lock() {
            lock(path, $meta)
        }
    }

    return new ProxyNumber(value)
}

const addProxyMethodsToFunction = (path, $meta, value) => {
    value.$freeze = () => freeze(path, $meta)
    value.$lock = () => lock(path, $meta)
    return value
}

module.exports = (obj) => proxy(obj)