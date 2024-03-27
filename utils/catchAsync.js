// this block will help to remove try/catch blocks from async function which is present in tourController.js
// eslint-disable-next-line arrow-body-style
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // it will automatically with parameter that this callback received
    // fn(req, res, next).catch((err) => next(err));
  };
};
