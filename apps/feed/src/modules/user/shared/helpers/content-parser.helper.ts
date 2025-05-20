import { GraphPostNode, NodeTypesEnum } from '@instapets-backend/common';
import { Node } from 'neo4j-driver';
import { neo4jDateParser } from './neo4j-date-parser.helper';

export function parseRawPostNode(content: Node): GraphPostNode {
  return {
    _id: content.properties.postId,
    type: NodeTypesEnum.POST,
    ...(content.properties as GraphPostNode),
    ...neo4jDateParser(content),
  };
}
