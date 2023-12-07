import { defaultSourceState, SourceState } from './SourceState'
import { assertEnvVar } from './utils/assertEnvVar'
import { getUpdateParams } from './shared/db/getUpdateParams'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

const dbClient = new DynamoDBClient()

export const dbDocClient = DynamoDBDocumentClient.from(dbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

const tableName = assertEnvVar('STATE_TABLE_NAME')

export class StateProvider {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }

  async get() {
    const command = new GetCommand({
      TableName: tableName,
      Key: { id: this.name },
    })

    const { Item } = await dbDocClient.send(command)

    return (Item || defaultSourceState) as SourceState
  }

  async update(params: Partial<SourceState>) {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: { id: this.name },
      ...getUpdateParams(params),
    })

    await dbDocClient.send(command)
  }
}
