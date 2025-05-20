import { Inject, Injectable } from '@nestjs/common';
import * as neo4jDriver from 'neo4j-driver';
import { NEO4J_DRIVER } from '@common/modules/neo4j/constants';

@Injectable()
export class Neo4jService {
  constructor(@Inject(NEO4J_DRIVER) private neo4jDriver: neo4jDriver.Driver) {}

  public async query(query: string, params: { [key: string]: any } = {}) {
    const neo4jSession = this.openSession();
    try {
      const result = await neo4jSession.run(query, params);
      const records = result.records;

      return records;
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log(error);
      throw error;
    } finally {
      await this.closeSession(neo4jSession);
    }
  }

  public async ping(): Promise<boolean> {
    const neo4jSession = this.openSession();
    try {
      const result = await neo4jSession.run('RETURN 1');
      const records = result.records;

      return records.length > 0;
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log(error);
      return false;
    } finally {
      await this.closeSession(neo4jSession);
    }
  }

  private openSession() {
    return this.neo4jDriver.session();
  }

  private async closeSession(session: neo4jDriver.Session) {
    await session.close();
  }
}
