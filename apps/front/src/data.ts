import cake from './assets/cake_11602050.png'
import bigCake from './assets/cake_1888887.png'
import croissant from './assets/croissant_7929743.png'
import bento from './assets/birthday-cake_113039.png'
import cupcake from './assets/cupcake_3173413.png'
import tea from './assets/teapot_7923329.png'
import coffee from './assets/coffee_3497933.png'
import juice from './assets/juice_6411284.png'
import milkshake from './assets/milkshake_11602133.png'
import cookies from './assets/cookies.png'
import iceCream from './assets/ice-cream.png'
import pistacha from './assets/pistacha.png'
import no from './assets/no.png'
import nuts from './assets/nuts.png'

export const categories = [
  {
    name: 'Կտորով',
    image: cake
  },
  {
    name: 'Ամբողջական',
    image: bigCake
  },
  {
    name: 'Կեքս',
    image: cupcake
  },
  {
    name: 'Բենտո',
    image: bento
  },
  {
    name: 'Կրուասան',
    image: croissant,
    sub: 'multi',
    multi: [
      {
        name: 'Size',
        child: [
          { name: 'Small', price: 100, image: croissant, imageSize: 55 },
          { name: 'Medium', price: 150, image: croissant, imageSize: 70 },
          { name: 'Large', price: 200, image: croissant, imageSize: 85 },
          { name: 'Large', price: 200, image: croissant, imageSize: 85 },
          { name: 'Large', price: 200, image: croissant, imageSize: 85 },
          { name: 'Large', price: 200, image: croissant, imageSize: 85 },
          { name: 'Large', price: 200, image: croissant, imageSize: 85 },
        ]
      },
      {
        name: 'Flavor',
        child: [
          { name: 'Chocolate', price: 50, image: no },
          { name: 'Plain', price: 0, image: pistacha },
          { name: 'Almond', price: 70, image: nuts }
        ]
      },
      {
        name: 'Size',
        child: [
          { name: 'Extra small', price: 100, image: croissant, imageSize: 40 },
          { name: 'Small', price: 100, image: croissant, imageSize: 55 },
        ]
      }
    ]
  },
  {
    name: 'Թխվածքաբլիթ',
    image: cookies
  },
  {
    name: 'Թեյ',
    image: tea
  },
  {
    name: 'Սուրճ',
    image: coffee
  },
  {
    name: 'Հյութ',
    image: juice
  },
  {
    name: 'Շեյք',
    image: milkshake
  },
  {
    name: 'Պաղպաղակ',
    image: iceCream
  }
]


const variations = {
  size: {
    options: {
      small: { name: 'Small' },
      medium: { name: 'Medium' },
      large: { name: 'Large' },
    }
  }
}


type OptionName = string;
type OptionValue = string;

type OptionId = string | number;
type VariantId = string | number;

type ProductOption = {
  name?: OptionName;
  slug: string;
  values: OptionValue[];
};

type Variant = {
  id?: string;
  options: Record<VariantId, OptionId>;
  accumulatedPrice: boolean;
  price?: number;
  stock?: number;
};

type Product = {
  id: string | number;
  name: string;
  price: number;
  options: ProductOption[];
  variants: Variant[];
  image: string;
};

const products: Product[] = [
  {
    id: 1,
    name: 'Կրուասան',
    image: cake,
    price: 0,
    options: [
      {
        name: 'Size',
        slug: 'size',
        values: ['Small', 'Medium', 'Large']
      },
      {
        name: 'Flavor',
        slug: 'flavor',
        values: ['Chocolate', 'Plain', 'Almond']
      }
    ],
    variants: [
      {
        options: {
          size: 0
          slug: 0
        }
      },

    ]
  },
];