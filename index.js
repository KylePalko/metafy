const proxy = (event = {}, path = [], originalEvent = null) => {

    if (typeof event !== 'object') {
        throw `event-type-non-object`
    }

    if (typeof event.$meta === 'undefined' && originalEvent === null) {
        event.$meta = {
            'frozen': [],
            'type-locked': []
        }
    }

    return new Proxy(event, {

        get: function (target, property) {

            const value = target[property]
            const _path = [ ...path, property ]

            if (originalEvent === null) {
                originalEvent = event
            }

            switch(property) {
                case '$freeze':
                    return freeze(_path, originalEvent.$meta)
                case '$lock':
                    return lock(_path, originalEvent.$meta)
                case '$meta':
                    throw 'meta-is-reserved-property'
            }

            /*
             * Proxy primitives are created to handle calls to $lock and $freeze on primitive types.
             */
            switch(typeof value) {
                case 'object':
                    return proxy(value, [ ...path, property ], originalEvent)
                case 'string':
                    return createProxyString(_path, originalEvent.$meta, value)
                case 'number':
                    return createProxyNumber(_path, originalEvent.$meta, value)
                case 'boolean':
                    return createProxyBoolean(_path, originalEvent.$meta, value)
                default:
                    return value
            }
        },

        set: function (target, property, value) {

            const _path = [ ...path, property ]

            if (isFrozen(_path, originalEvent.$meta)) {
                throw `property-frozen`
            } else if (isTypeLocked(_path, originalEvent.$meta) && typeof value !== typeof target[property]) {
                throw `property-type-locked`
            }

            target[property] = value
        }
    })
}

const freeze = (path, $meta) => {

    if (path.length === 1) {
        throw `root-cannot-be-frozen`
    }

    $meta['frozen'] = [
        ...$meta['frozen'],
        path.slice(0, path.length).join('.')
    ]
}

const lock = (path, $meta) => {

    if (path.length === 1) {
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

module.exports = (event) => proxy(event)