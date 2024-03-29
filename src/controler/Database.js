const notInitializedDynasty = require('dynasty');

class Database {
  constructor(tableName, region, skillName) {
    this.dynasty = notInitializedDynasty({ region });
    this.tableName = tableName;
    this.skillName = skillName || tableName;
    this.table = this.dynasty.table(this.tableName);
  }

  createTable() {
    return this.dynasty.describe(this.tableName).catch(() => this.dynasty.create(this.tableName, {
      key_schema: {
        hash: ['userId', 'string'],
      },
    }));
  }

  writeUserData(userId, userData) {
    console.inspect('persisted user data');
    return this.table
      .insert({
        ...userData,
        skillName: this.skillName,
        userId,
      })
      .catch((error) => {
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
