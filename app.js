const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const databasePath = path.join(__dirname, 'covid19India.db')
const app = express()

app.use(express.json())

let database = null

const intializeDbobjectofState = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.messgae}`)
    process.exit(1)
  }
}

intializeDbobjectofState()

const convertObjectOfState = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertObjectOfDistrict = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

const convertReportObject = dbObject => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStateQuery = `
    SELECT
      *
    FROM
     state
    ORDER BY
     state_id;
     `
  const stateArray = await database.all(getStateQuery)
  response.send(stateArray.map(eachState => convertObjectOfState(eachState)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getstateQuery = `
    SELECT 
     *
     FROM 
      state
    WHERE
    state_id = ${stateId}
    `
  const state = await database.all(getstateQuery)
  response.send(convertObjectOfState(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
   INSERT INTO
     district (district_name,state_id,cases,cured,active,deaths)
   VAlUES
     ('${districtName}',${stateId},${cases},${cured},${active},${deaths})
  `
  await database.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT 
      *
    FROM 
      district
    WHERE
    district_id = ${districtId}
    `
  const district = await database.all(getDistrictQuery)
  response.send(convertObjectOfDistrict(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
    DELETE FROM
      district
    WHERE 
      district_id = ${districtId}
    `
  await database.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const updateDistrictQuery = `
    UPDATE
      district
    SET 
      district_name = '${districtName}',
      state_id = ${stateId},
      case = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE
      district_id = ${districtId}
    `
  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
    SELECT
     SUM(cases) as totalCases,
     SUM(cured) as toatalCured,
     SUM(active) as totalActive,
     SUM(deaths) as totalDeaths
    FROM 
     district
    WHERE
     state_id = ${stateId}
    `
  const stats = await database.get(getStateStatsQuery)
  response.send(stats)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
   SELECT
     state_id
   FROM 
     district
   WHERE
     district_id = ${districtId}
   
   `

  const districtResponse = await database.get(getDistrictIdQuery)
  response.send(districtResponse)
})

module.exports = app
