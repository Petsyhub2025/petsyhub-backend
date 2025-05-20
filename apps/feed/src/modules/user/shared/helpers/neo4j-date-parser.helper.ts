import { Node, Relationship } from 'neo4j-driver';

export function neo4jDateParser(node: Node): { createdAt: string };
export function neo4jDateParser(relation: Relationship): { createdAt: string };
export function neo4jDateParser(nodeOrRelation: Node | Relationship): { createdAt: string } {
  return {
    ...(nodeOrRelation.properties?.createdAt?.year?.toInt() && {
      createdAt: new Date(
        nodeOrRelation.properties.createdAt?.year.toInt(),
        nodeOrRelation.properties.createdAt?.month.toInt() - 1,
        nodeOrRelation.properties.createdAt?.day.toInt(),
        nodeOrRelation.properties.createdAt?.hour.toInt(),
        nodeOrRelation.properties.createdAt?.minute.toInt(),
        nodeOrRelation.properties.createdAt?.second.toInt(),
        nodeOrRelation.properties.createdAt?.nanosecond.toInt() / 1000000,
      )?.toISOString(),
    }),
  };
}
