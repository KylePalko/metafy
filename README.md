# Metafy

Convert any normal object into an object with meta data that describes and limits how the data can be interacted with.

To use

```
yarn add metafy
```

To prevent changing the type of a property.

```
const metafy = require('metafy')

const MyObject = metafy({
   message: 'Hello, world!'
})

MyObject.message.$lock() // Prevents changing of types

try {
    MyObject.message = 5
} catch (err) {
    // Will throw because attempted to change type.
}
```
To prevent changing a property in any way.

```
const metafy = require('metafy')

const MyObject = metafy({
   message: 'Hello, world!'
})

MyObject.message.$freeze() // Freeze the value

try {
   MyObject.message = 'Hello!'
} catch (err) {
   // Will throw because value was reassigned by is frozen.
}
```