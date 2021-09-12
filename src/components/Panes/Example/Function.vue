<template>
  <div class="p-5 cursor-pointer">
    <button class="border m-2 px-2 py-1" @click="tap('left', 0)">
      左边第一个位置插入
    </button>
    <button class="border m-2 px-2 py-1" @click="tap('left', 3)">
      左边第四个位置插入
    </button>
    <button class="border m-2 px-2 py-1" @click="tap('right', 1)">
      右边第二个位置插入
    </button>
    <div class="select-none py-2 text-sm">
      <div class="">
        <span @click="add('left')">左边插入</span> |
        <span @click="add('centre')">中间插入</span> |
        <span @click="add('right')">右边插入</span>
      </div>
      <div class="mb-2">
        <span @click="toggle('left')">左边切换</span> |
        <span @click="toggle('centre')">中间切换</span> |
        <span @click="toggle('right')">右边切换</span> |
        <span @click="toggle('bottom')">底部切换</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Function',
  inject: ['addBlock', 'clickPane', 'togglePane', 'layoutRef', 'getLayout'],
  props: {},
  data: () => ({}),
  computed: {},
  methods: {
    tap(name, index) {
      const item = {
        name: 'New ' + Number(new Date()),
        component: 'other',
        open: true,
        props: { val: '新建' + Number(new Date()) },
      };
      this.addBlock(name, item, index);
    },
    toggle(name) {
      this.togglePane(name);
    },
    add(name, index) {
      const item = {
        name: 'New ' + Number(new Date()),
        component: 'other',
        open: true,
        props: { val: '新建' + Number(new Date()) },
      };

      this.addBlock(name, item, index);
    },
  },
};
</script>

<style></style>
