<script>
import {
  addResizeListener,
  removeResizeListener,
  titleBlockHeight,
  toSize,
  createSvg,
  svgs,
  debounce
} from './utils';
import TitleBlock from './TitleBlock';

export default {
  name: 'Bottom',
  inject: ['layoutRef', 'itemRef', 'togglePane'],
  props: {
    name: {
      type: String,
      default: '',
    },
    riseHeight: {
      type: Number || String,
      default: 80,
    },
    size: {
      type: Number,
      default: 0,
    },
    rise: {
      type: Boolean,
    },
    open: {
      type: Boolean || Number,
      default: true,
    },
  },
  data() {
    return {
      rawSize: this.size,
    };
  },
  computed: {
    toggleState({ rise, open }) {
      return open && !rise;
    },
    height({ rise, riseHeight }) {
      let h = riseHeight;
      if (!h) {
        h = 80;
      }
      return rise ? `${parseFloat(h)}%` : '100%';
    },
  },
  watch: {
    open: {
      handler(open) {
        const item = this.itemRef();
        item.toggleResizable({ target: item, state: !!open });
      },
      immediate: true,
    },
  },
  mounted() {
    const resize = () => {
      if (!this.open) {
        setTimeout(this.closeOpen);
      }
    };
    resize();
    const resizeListener = debounce(resize, 5, true);
    addResizeListener(this.$el, resizeListener);
    this.$once('hook:destroyed', () => {
      removeResizeListener(this.$el, resizeListener);
    });
  },
  methods: {
    closeOpen() {
      const minHeight = toSize(
        this.layoutRef(),
        `${titleBlockHeight}px`,
        'clientHeight'
      );
      let height = this.toggleState ? this.rawSize : minHeight;
      if (this.rawSize === minHeight) {
        this.rawSize = height = 50;
      }
      this.togglePane('bottom', height);
    },
  },
  render(h) {
    const toggleRise = event => {
      event.stopPropagation();
      this.$emit('updateRise', !this.rise);
    };
    const toggleOpen = event => {
      if (this.rise) {
        toggleRise(event);
        return;
      }

      event.stopPropagation();
      if (this.open) {
        this.rawSize = toSize(
          this.layoutRef(),
          `${this.itemRef().$el.clientHeight}px`,
          'clientHeight'
        );
      }
      this.$emit('updateOpen', !this.open);
      this.$nextTick(() => {
        this.closeOpen();
      });
    };
    return h(
      'div',
      {
        class: { 'bottom-box': true, rise: this.rise },
        style: {
          zIndex: this.layoutRef().maxIndex,
        },
      },
      [
        this.rise
          ? h('div', {
              class: 'mask--layer',
              on: {
                click: toggleRise,
              },
            })
          : '',
        h(
          'div',
          {
            class: 'bottom-board',
            style: {
              height: this.height,
            },
          },
          [
            h(TitleBlock, {
              props: {
                item: { name: this.name, full: true },
                renderTools: (h, tools) => {
                  const newTools = tools.slice(0, 2);
                  newTools.push(
                    h(
                      'span',
                      {
                        class: 'tools--up',
                        on: {
                          click: toggleRise,
                        },
                      },
                      [createSvg(h, svgs.arrows)]
                    )
                  );

                  return newTools;
                },
              },
              on: {
                handle: (event, name) => {
                  switch (name) {
                    case 'toggle':
                      toggleOpen(event);
                      break;
                    default:
                      console.log(name);
                  }
                },
              },
            }),
            // h(
            //   'div',
            //   {
            //     class: 'bottom--title',
            //   },
            //   [
            //     h('span', {}, [createSvg(h, svgs.dot)]),
            //     h(
            //       'div',
            //       {
            //         on: {
            //           click: toggleOpen,
            //         },
            //       },
            //       this.name
            //     ),
            //     h(
            //       'span',
            //       {
            //         class: 'bottom--toggle',
            //         on: {
            //           click: toggleRise,
            //         },
            //       },
            //       [createSvg(h, svgs.arrows)]
            //     ),
            //   ]
            // ),
            this.$slots.default,
          ]
        ),
      ]
    );
  },
};
</script>

<style lang="less" scoped>
@import './utils.less';

.bottom-box {
  height: 100%;
  width: 100%;

  &.rise {
    top: 0;
    position: absolute;

    /deep/ .tools--up {
      visibility: visible;
      transform: rotate(180deg);
    }

    .bottom-board {
      bottom: 0;
      left: 0;
      position: absolute;
    }
  }
}

.bottom-board {
  width: 100%;
  height: 100%;
  background: #fff;
}
</style>
