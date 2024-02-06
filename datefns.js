const { sub, format} = require('date-fns')

const currentDate = new Date()

const newDate = sub(currentDate, {minutes: 3})

const formattedCurrentDate = format(currentDate, 'yyyy-MM-dd HH:mm:ss');
const formattedNewDate = format(newDate, 'yyyy-MM-dd HH:mm:ss');

console.log("Current Date", formattedCurrentDate)
console.log("formatted Date", formattedNewDate)