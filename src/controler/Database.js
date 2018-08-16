const dynasty = require("dynasty")({ region: "eu-west-1" });

class Database {
  constructor(tableName) {
    this.tableName = tableName;
    this.table = dynasty.table(this.tableName);
  }

  createTable() {
    return dynasty.describe(this.tableName).catch(() =>
      dynasty.create(this.tableName, {
        key_schema: {
          hash: ["userId", "string"]
        }
      })
    );
  }

  writeUserData(userId, userData) {
    console.inspect("persisted user data");
    return this.table
      .insert({
        ...userData,
        userId
      })
      .catch(error => {
        console.error(error);
      });
  }

  async readUserData(userId) {
    try {
      const DBResult = await this.table.find(userId);
      console.inspect({ DBResult });
      return DBResult;
    } catch (e) {
      console.error({ e });
      if (e.code.match(/ResourceNotFoundException/)) {
        console.log(`Creating table ${this.tableName}`);
        await this.createTable();
      }
    }
    return null;
  }
}

module.exports = Database;
