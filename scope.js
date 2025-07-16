var foo = 1;
const bar = 1;

{
  var foo = 2;
  const bar = 2;
}

(() => {
  var foo = 3;
  const bar = 3;
})();

console.info("var keyword >>> ", foo); // 2
console.info("const keyword >>> ", bar); // 1
