import { defaultSourceState, SourceState } from './SourceState'
import { assertEnvVar } from './utils/assertEnvVar'
import { DynamoDB } from 'aws-sdk'
import { getUpdateParams } from './shared/db/getUpdateParams'

const documentClient = new DynamoDB.DocumentClient()
const tableName = assertEnvVar('STATE_TABLE_NAME')

export class StateProvider {
  readonly name: string

  constructor(name: string) {
    this.name = name
  }

  async get() {
    const { Item } = await documentClient
      .get({
        TableName: tableName,
        Key: { id: this.name },
      })
      .promise()

    return (Item || defaultSourceState) as SourceState
  }

  async update(params: Partial<SourceState>) {
    await documentClient
      .update({
        TableName: tableName,
        Key: { id: this.name },
        ...getUpdateParams(params),
      })
      .promise()
  }
}
