module.exports = class Func {
  static indexItem(arr, id) {
    const index = arr.findIndex((el) => el.id === Number(id));
    return index;
  }

  static getTime() {
    const date = new Date();
    return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
  }
};
