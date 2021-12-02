const mongoose = require('mongoose')

const Schema = new mongoose.Schema(
  {
    name: { type: String },
    company: { type: String, default: undefined },
    visiting: { type: String, default: undefined },
    createdOn: { type: Date, default: () => new Date() },
    updatedOn: { type: Date, default: undefined },
    visitationDates: { type: [Date], default: [] }
  },
  {
    collection: 'visitors',
    strict: true
  }
)

const Model = mongoose.model('Visitors', Schema)

module.exports = { Model, Schema }
