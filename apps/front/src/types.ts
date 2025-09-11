export interface ProductItemType {
  id?: string;
  name?: string;
  price?: number;
  image?: string;
  imageSize?: string;
  sub?: string;
  multi?: {
    name: string;
    child: {
      name: string;
      price: number;
      image: string;
      imageSize?: number;
    }[];
  }[];
}

export interface PageItem {
  name: string;
  parent_id: string | null;
}