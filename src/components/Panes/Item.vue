<template>
  <div class="panes__pane" :style="style" @click="clickPane($event, _uid)">
    <slot />
  </div>
</template>

<script>
import { toSize } from './utils';

export default {
  name: 'Item',
  inject: [
    'requestUpdate',
    'toggleResizable',
    'addPane',
    'removePane',
    'clickPane',
  ],
  provide() {
    return {
      itemRef: () => this,
    };
  },
  props: {
    size: { type: [Number, String], default: null },
    minSize: { type: [Number, String], default: 0 },
    maxSize: { type: [Number, String], default: 100 },
    alias: { type: String, default: '' },
  },
  data: () => ({
    style: {},
  }),
  computed: {
    sizeNumber() {
      return this.size;
    },
  },
  watch: {
    sizeNumber(size) {
      this.requestUpdate({ target: this, size });
    },
  },
  mounted() {
    this.addPane(this);
  },
  beforeDestroy() {
    this.removePane(this);
  },
  methods: {
    getSize() {
      const size = this.$el[
        this.$parent.horizontal ? 'offsetHeight' : 'offsetWwidth'
      ];
      return toSize(this.$parent, size);
    },
    update(style) {
      this.style = style;
    },
  },
};
</script>
