<script>
import { createSvg, svgs } from './utils';

export default {
  name: 'TitleBlock',
  functional: true,
  props: {
    item: {
      type: Object,
      required: true,
    },
    renderTools: {
      type: Function,
      default(h, children) {
        return children;
      },
    },
  },
  render(h, { props, listeners }) {
    const clickToggle = event => {
      listeners.handle(event, 'toggle');
    };
    // todo 上下移动
    // const upOrDown =
    //   item.full || item.detach
    //     ? []
    //     : [
    //         index === '0'
    //           ? ''
    //           : h(
    //               'span',
    //               {
    //                 class: 'tools--up',
    //                 on: {
    //                   click(event) {
    //                     event.stopPropagation();
    //                   },
    //                 },
    //               },
    //               [createSvg(h, svgs.up)]
    //             ),
    //         Number(index) === len
    //           ? ''
    //           : h(
    //               'span',
    //               {
    //                 class: 'tools--down',
    //                 on: {
    //                   click(event) {
    //                     event.stopPropagation();
    //                   },
    //                 },
    //               },
    //               [createSvg(h, svgs.up)]
    //             ),
    //       ];
    const children = props.renderTools(h, [
      h(
        'span',
        {
          class: 'tools--toggle',
          on: {
            click: clickToggle,
          },
        },
        [
          createSvg(
            h,
            props.item.full || props.item.detach ? svgs.dot : svgs.arrows
          ),
        ]
      ),
      h('div', props.item.name),
      h(
        'span',
        {
          class: 'tools--delete',
          attrs: {
            title: '删除',
          },
          on: {
            click: event => {
              listeners.handle(event, 'remove');
            },
          },
        },
        [createSvg(h, svgs.delete)]
      ),
      // ...upOrDown,
      h(
        'span',
        {
          class: 'tools--fill',
          attrs: {
            title: '填满',
          },
          on: {
            click: event => {
              listeners.handle(event, 'fill');
            },
          },
        },
        [createSvg(h, svgs.fill)]
      ),
      h(
        'span',
        {
          class: 'tools--detach',
          attrs: {
            title: '悬浮',
          },
          on: {
            click: event => {
              listeners.handle(event, 'detach');
            },
          },
        },
        [createSvg(h, svgs.detach)]
      ),
      h(
        'span',
        {
          class: 'tools--full',
          attrs: {
            title: '全屏',
          },
          on: {
            click: event => {
              listeners.handle(event, 'full');
            },
          },
        },
        [createSvg(h, svgs.full)]
      ),
    ]);

    return h(
      'div',
      {
        on: {
          click: event => {
            if (props.item.detach) return;
            clickToggle(event);
          },
        },
        class: ['title__bolck'],
      },
      children
    );
  },
};
</script>

<style lang="less" scoped>
@import './utils.less';

@titleHeight: var(--pane-layout-title-height);

.title__bolck {
  .title();
  height: @titleHeight;
  overflow: hidden;
  &:hover {
    .tools {
      &--down,
      &--fill,
      &--up,
      &--full,
      &--detach,
      &--delete {
        visibility: visible;
      }
    }
  }
  .tools {
    &--down,
    &--up,
    &--delete,
    &--detach,
    &--fill,
    &--full {
      visibility: hidden;
      &:hover {
        svg {
          fill: #111;
        }
      }
    }
    &--toggle,
    &--fill {
      svg {
        height: 10px;
      }
    }
    &--down {
      transform: rotate(180deg);
    }
    &--toggle {
      transform: rotate(90deg);
    }
  }
}
</style>
