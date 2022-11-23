# useAsync
![State Badge](https://shields.io/badge/-experimental-orange)
![Types Badge](https://shields.io/badge/types-TypeScript-blue)
![React Badge](https://shields.io/github/package-json/dependency-version/Billocap/useAsync/react/legacy-react-16)
![React DOM Badge](https://shields.io/github/package-json/dependency-version/Billocap/useAsync/react-dom/legacy-react-16)

*This branch adds support for React 16*

`useAsync` is a hook that wraps an `async function` and give you more control over its [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

## Installation
```
npm install Billocap/useAsync#legacy-react-16 --save

yarn add Billocap/useAsync#legacy-react-16 --save
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
