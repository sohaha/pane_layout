<template>
  <div
    id="demo"
    class="w-screen h-screen bg-gray-100 overflow-hidden text-gray-500 text-center bg-gray-100"
  >
    <layout :height="height" :width="width" :layout="layout" />
  </div>
</template>

<script>
import Layout from '../Layout';
import { register } from '../index';

register('full', () => import('./Full'));
register('other', () => import('./Other'));
register('function', () => import('./Function'));

export default {
  name: 'Demo',
  components: { Layout },
  data: () => ({
    layout: {
      left: {},
      right: {},
    },
    height: '100vh',
    width: '100vw',
  }),
  mounted() {
    const layout = {
      right: {
        size: 15,
        minSize: 10,
        maxSize: 50,
        items: [{ name: '右边-', component: 'other' }],
      },
      centre: {
        size: 30,
        minSize: 30,
        items: [
          {
            name: '-中 间-',
            component: 'full',
            open: true,
            props: { el: this.$refs.layout },
          },
        ],
      },
      bottom: {
        size: 20,
        riseHeight: 80,

        maxSize: 50,
        name: '底部',
        component: 'function',
      },
      left: {
        maxSize: 60,
        items: [
          {
            name: '左边 0',
            component: 'other',
            props: { val: '0' },
          },
          {
            name: '左边 1',
            component: 'other',
            open: true,
            props: { val: '左边 1' },
          },
        ],
      },
    };
    this.layout = layout;
  },
  methods: {},
};
</script>

<style lang="less" scoped>
/deep/ .item__bottom {
  background: rgba(255, 0, 0, 0.116);
}
/deep/ .item__content {
  background: rgba(144, 136, 224, 0.116);
}
/deep/ .item__left {
  background: rgba(144, 136, 224, 0.116);
}
/deep/ .item__centre {
  background: rgba(199, 187, 75, 0.116);
}
/deep/ .item__right {
  background: rgba(233, 218, 178, 0.116);
}
</style>
