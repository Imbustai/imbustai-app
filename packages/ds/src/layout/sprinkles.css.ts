import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';
import { vars } from '../theme/tokens';

const space = vars.space;
const radius = vars.radius;

const spaceWithAuto = { ...space, auto: 'auto' } as const;

const widthPresets = {
  full: '100%',
  auto: 'auto',
  '1/2': '50%',
  '1/3': '33.333%',
  '2/3': '66.667%',
  '1/4': '25%',
  '3/4': '75%',
} as const;

const maxWidthPresets = {
  none: 'none',
  full: '100%',
  container: '72rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
} as const;

const heightPresets = {
  full: '100%',
  screen: '100dvh',
  auto: 'auto',
} as const;

const conditions = {
  mobile: {},
  tablet: { '@media': 'screen and (min-width: 768px)' },
  desktop: { '@media': 'screen and (min-width: 1024px)' },
} as const;

const responsiveProperties = defineProperties({
  conditions,
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'block', 'flex', 'grid', 'inline', 'inline-flex', 'inline-block'],
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
    flexWrap: ['wrap', 'nowrap', 'wrap-reverse'],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
    alignSelf: ['auto', 'stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
    justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
    gap: space,
    rowGap: space,
    columnGap: space,
    padding: space,
    paddingTop: space,
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    margin: spaceWithAuto,
    marginTop: spaceWithAuto,
    marginBottom: spaceWithAuto,
    marginLeft: spaceWithAuto,
    marginRight: spaceWithAuto,
    position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    width: widthPresets,
    maxWidth: maxWidthPresets,
    height: heightPresets,
    borderRadius: radius,
    overflow: ['visible', 'hidden', 'auto', 'scroll'],
    flexGrow: [0, 1],
    flexShrink: [0, 1],
  },
  shorthands: {
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom'],
  },
});

export const sprinkles = createSprinkles(responsiveProperties);
export type Sprinkles = Parameters<typeof sprinkles>[0];
