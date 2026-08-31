declare module "@imgly/background-removal" {
  export function removeBackground(image: Blob | File): Promise<Blob>;
}
