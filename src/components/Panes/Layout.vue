<script>
import Item from './Item';
import Panes from './Panes';
import Accordion from './Accordion';
import Bottom from './Bottom';
import {
  addResizeListener,
  removeResizeListener,
  debounce,
  padItem,
  titleBlockHeight
} from './utils';
import interact from 'interactjs';

export default {
  name: 'Layout',
  components: { Panes, Item, Accordion, Bottom },
  provide() {
    return {
      addBlock: this.addBlock,
      removeBlock: this.removeBlock,
      getLayout: this.getLayout,
      loadLayout: this.loadLayout,
      togglePane: this.togglePane,
      toggleFull: this.toggleFull,
      layoutRef: this.layoutRef,
    };
  },
  props: {
    layout: {
      type: Object,
      default: () => ({}),
    },
    height: {
      type: String,
      default: '600px',
    },
    width: {
      type: String,
      default: '100%',
    },
  },
  data: () => ({
    full: false,
    history: {},
    bind: {},
    maxIndex: 1000, // todo 后期通过排序优先掉该属性
  }),
  computed: {
    emptyLayout() {
      return Object.keys(this.history).length === 0;
    },
  },
  watch: {
    layout(data) {
      this.loadLayout(data);
    },
  },
  beforeDestroy() {
    this.release();
  },
  mounted() {
    this.loadLayout(this.layout);
  },
  methods: {
    layoutRef() {
      return this;
    },
    init() {
      setTimeout(() => {
        for (const name in this.bind) {
          if (Object.hasOwnProperty.call(this.bind, name) && this.$refs[name]) {
            const obj = interact(this.$refs[name].$el);
            this.bind[name] = obj;
          }
        }
        const resizeListener = debounce(() => this.$emit('resize'), 50, true);
        addResizeListener(this.$el, resizeListener);
        this.$once('hook:destroyed', () => {
          removeResizeListener(this.$el, resizeListener);
        });
      }, 32);
    },
    release() {
      for (const name in this.bind) {
        if (Object.hasOwnProperty.call(this.bind, name)) {
          if (!this.bind[name]) {
            continue;
          }
          this.bind[name].unset();
          this.bind[name] = null;
        }
      }
    },
    getLayout(removeAttr = ['on', 'props']) {
      const history = {};
      for (const key in this.history) {
        if (Object.hasOwnProperty.call(this.history, key)) {
          const l = this.history[key];
          const items = [];
          for (const key in l.items) {
            if (Object.hasOwnProperty.call(l.items, key)) {
              const item = {};
              Object.entries(l.items[key]).forEach(([key, value]) => {
                if (
                  key.slice(0, 1) !== '_' &&
                  !(removeAttr && removeAttr.includes(key))
                ) {
                  item[key] = value;
                }
              });
              items.push(item);
            }
          }
          history[key] = { ...l };
          if (items.length) history[key].items = items;
        }
      }
      return history;
    },
    addBlock(name, item, index) {
      const exist = typeof this.history[name] === 'object';
      if (!exist) {
        console.warn('There is no defined groups');
        return;
      }
      if (index !== undefined) {
        this.history[name]['items'].splice(index, 0, padItem(item));
      } else {
        this.history[name]['items'].push(padItem(item));
      }
    },
    toggleFull() {
      this.full = !this.full;
      const el = this.$el;
      if (this.full) {
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.position = 'absolute';
      } else {
        el.style.width = '';
        el.style.height = '600px';
        el.style.position = '';
      }

      el.style.left = 0;
      el.style.top = 0;
      el.style.background = '#fff';
    },
    loadLayout(layout) {
      this.release();
      this.history = {};
      const history = {};
      for (const key in layout) {
        if (Object.hasOwnProperty.call(layout, key)) {
          const l = layout[key];
          const items = [];
          for (const key in l.items) {
            if (Object.hasOwnProperty.call(l.items, key)) {
              items.push(padItem(l.items[key]));
            }
          }
          history[key] = { ...l };
          history[key].items = items;
        }
      }
      this.$nextTick(() => {
        this.history = history;
        setTimeout(() => {
          if (!this.$refs.contentPanes) return;
          this.init();
          this.$refs.contentPanes.initSize();
        });
      });
    },
    togglePane(name, size = 0) {
      if (size === 0) {
        this.$set(this.history[name], 'hidden', !this.history[name].hidden);
      } else {
        this.$set(this.history[name], 'size', size);
      }
      setTimeout(() => {
        this.$refs.contentPanes.initSize();
      });
    },
    removeBlock(name, index) {
      const layout = this.history[name];
      layout.items.splice(index, 1);
    },
    updateLayout(layout) {
      this.$emit('update:layout', layout);
    },
    saveSize(sort, panes) {
      panes.forEach((pane, index) => {
        const name = sort[index];
        if (name) {
          this.history[name].size = pane.size;
        }
      });
    },
    createItem(h, name) {
      const layout = this.history[name] || {};
      const items = layout['items'];
      let state = layout['hidden'];
      if (state === undefined) {
        state = false;
        this.$set(layout, 'hidden', state);
      }
      const size = layout.size;
      const minSize = layout.minSize || 0;
      const maxSize = layout.maxSize || 100;
      const child = [];
      const cacheKeys = [];

      if (items && items.length > 0) {
        for (const index in items) {
          if (Object.hasOwnProperty.call(items, index)) {
            const v = items[index];
            let key = `${v.component}|${v.key || v.name || Number(new Date())}`;
            if (!v._key) {
              // eslint-disable-next-line max-depth
              if (cacheKeys.includes(key)) {
                key = key + Number(new Date());
              }
              this.history[name]['items'][index]._key = key;
            } else if (cacheKeys.includes(v._key)) {
              this.history[name]['items'][index]._key =
                v._key + Number(new Date());
            }
            cacheKeys.push(v._key);
          }
        }

        const accordion = h('accordion', {
          props: {
            items,
          },
          on: {
            remove: index => {
              this.removeBlock(name, index);
            },
          },
        });
        child.push(accordion);
      } else {
        return '';
      }
      if (this.bind[name] === undefined) {
        this.bind[name] = null;
      }
      const dragover = event => {
        event.preventDefault();
      };
      return !state
        ? h(
            'item',
            {
              ref: name,
              class: {
                [`item__${name}`]: true,
              },
              nativeOn: {
                dragover,
                drop: event => {
                  const history = this.history;
                  const { place, index } = JSON.parse(
                    event.dataTransfer.getData('Text')
                  );
                  if (!history[place]) {
                    return;
                  }
                  let point = event.srcElement;
                  let newIndex = null;
                  if (point) {
                    while (true) {
                      if (point === this.$el) {
                        break;
                      }
                      if (
                        point.dataset &&
                        typeof point.dataset.index !== 'undefined'
                      ) {
                        newIndex = point.dataset.index;
                        break;
                      }
                      point = point.parentElement;
                    }
                  }
                  const item = padItem(
                    history[place]['items'].splice(index, 1)[0]
                  );
                  if (newIndex === null) {
                    history[name]['items'].push(item);
                  } else {
                    history[name]['items'].splice(newIndex, 0, item);
                  }
                },
              },
              props: {
                alias: name,
                size: size,
                maxSize: maxSize,
                minSize: minSize,
              },
            },
            child
          )
        : ['left', 'right'].includes(name)
        ? ''
        : '';
    },
  },
  render(h) {
    if (this.emptyLayout) return '';
    const bottomInfo = this.history['bottom'] || {};
    const bottomProps = {
      open: true,
      riseHeight: 90,
      rise: false,
      ...bottomInfo,
    };
    const bottom =
      bottomInfo.component && !bottomInfo.hidden
        ? h(
            'item',
            {
              class: {
                [`item__bottom`]: true,
              },
              props: {
                size: bottomInfo.component ? bottomInfo.size : 0,
                maxSize: bottomInfo.maxSize || 100,
                minSize: bottomInfo.minSize || 0,
              },
            },
            [
              h(
                'Bottom',
                {
                  on: {
                    updateRise: rise => {
                      this.$set(this.history['bottom'], 'rise', rise);
                    },
                    updateOpen: open => {
                      this.$set(this.history['bottom'], 'open', open);
                    },
                  },
                  props: {
                    ...bottomProps,
                    toggleOpen: open => {
                      this.$set(this.history['bottom'], 'open', open);
                    },
                  },
                },
                [h(bottomInfo.component)]
              ),
            ]
          )
        : '';

    const contentPanes = h(
      'panes',
      {
        ref: 'contentPanes',
        props: {},
        on: {
          resize: panes => {
            this.saveSize(['left', 'centre', 'right'], panes);
          },
        },
      },
      [
        this.createItem(h, 'left'),
        this.createItem(h, 'centre'),
        this.createItem(h, 'right'),
      ]
    );

    const content = h(
      'item',
      {
        class: {
          [`item__content`]: true,
        },
        props: {
          size: bottomInfo.size ? 100 - bottomInfo.size : null,
        },
      },
      [contentPanes]
    );

    const layout = h(
      'panes',
      {
        class: 'layout',
        ref: 'panes',
        style: {
          height: this.height,
          width: this.width,
          '--pane-layout-title-height': `${titleBlockHeight}px`,
        },
        on: {
          resize: panes => {
            this.saveSize(['', 'bottom'], panes);
          },
        },
        props: {
          horizontal: true,
        },
      },
      [content, bottom]
    );
    return layout;
  },
};
</script>

<style lang="less">
.panes--horizontal {
  .panes__splitter {
    min-height: 0;
  }
  > .panes__splitter:before {
    top: -2px;
    bottom: -2px;
    width: 100%;
  }
}
.panes--vertical {
  .panes__splitter {
    min-width: 0;
  }
  > .panes__splitter:before {
    left: -2px;
    right: -2px;
    height: 100%;
  }
}

.panes__splitter {
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    transition: opacity 0.4s;
    background-color: rgba(0, 0, 0, 0.05);
    opacity: 0;
    z-index: 1;
  }
  &:hover:before {
    opacity: 1;
  }
}

.layout {
  position: relative;
  box-shadow: 0 0 1px;

  .item__content {
    div > .panes__pane:not(:first-child) {
      border-left: 1px solid rgba(0, 0, 0, 0.02);
    }
  }
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background-color: #fafafa;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #cccccc;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #999999;
  }

  ::-webkit-scrollbar-thumb:active {
    background-color: #cccccc;
  }
}
</style>
