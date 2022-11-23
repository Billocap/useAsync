# useAsync
![](https://shields.io/badge/-experimental-orange) ![](https://shields.io/badge/include-types-blue)

*This branch add support for react 16*

`useAsync` is a hook that wraps an `async function` and give you more control over its [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

## Installation
```
npm install Billocap/useAsync#react-16 --save

yarn add Billocap/useAsync#react-16 --save
```
_I don't recommend using `yarn` once it will include the `src` folder in the installed package._

## Syntax
```js
useAsync(callback);
useAsync(callback, args);
useAsync(callback, options);
useAsync(callback, args, options);

useAsync(
	(...args) => {/* Returns a Promise */},
	[...args], // Arguments to the wrapped function,
	{
		defaults: {
			value: "default value",
			reason: "default reason"
		},
    persistent: true //boolean
	}
);
```
