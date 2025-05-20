export class GraphFeedResponseDto {
  public id: number;
  public contentType: string;
  public content: object | null;
  public action?: object | null;
}
