// +++ ES6 Modules +++ //
//Default Exports

// import add from "./calculation.mjs";

// console.log(add(4,5))

//Named Exports

import {add , sub} from "./calculation.mjs"

console.log("sum ===>", add(3,7))
console.log("sub ===>", sub(5,2))