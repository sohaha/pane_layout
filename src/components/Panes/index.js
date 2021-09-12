import Vue from 'vue';
import Layout from './Layout';

export const components = { Layout };

function install(Vue) {
  if (install.installed) return;
  components.map(component => Vue.component(component.name, component));
}

// 判断是否是直接引入文件
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export default { install };

const indComponent = [];

export function register(name, component) {
  let n = name;
  let c = component;
  if (!component) {
    if (!name.name) {
      console.warn('No component Name cannot be registered');
      return;
    }
    n = name.name;

    c = name;
  }
  if (indComponent.includes(n)) {
    console.warn('Existing components with the same');

    return;
  }
  Vue.component(n, c);
}
