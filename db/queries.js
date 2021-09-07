const dbToApp = require('../dataProcessing/dbToApp');

const promise = require('bluebird');
const bcrypt          = require('bcrypt');                         // bcrypt will encrypt passwords to be saved in db
const crypto          = require('crypto');

const options = {
  promiseLib: promise
};

const pgp = require('pg-promise')(options);

const db = pgp({
  user: 'dummyUsername',
  database: 'dummy_Database',
  password: 'dummyPassword',
  host: 'dummy-database.dummy.eu-dummy-1.rds.amazonaws.com',
  port: 0000,
});

function createUserAccount(req, res, next) {
  let user = req.body;
  hashPassword(user.password)
    .then((hashedPassword) => {
      delete user.password;
      user.password_digest = hashedPassword
    })
    .then(() => createToken())
    .then(token => req.body.token = token)
    .then(() => {
      const query = "INSERT INTO UserAccount(emailAddress, password, token, forename, surname, practitionerID, navigatorID) " +
        "VALUES('" + user.emailAddress + "','" + user.password_digest + "','" + user.token + "','" + user.forename + "','" +
        user.surname + "'," + user.practitionerID + "," + user.navigatorID + ") RETURNING " +
        "emailAddress;";
      db.any(query)
        .then(function resolve(data) {
          res.status(200).send(data);
        })
        .catch(function error(err) {
          return next(err);
        });
    })
    .then(function resolve(data) {
      delete user.password_digest;
    })
    .catch(function error(err) {
      // return next(err)
    })
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      err ? reject(err) : resolve(hash)
    })}
  )
}

function createToken() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, data) => {
      err ? reject(err) : resolve(data.toString('base64'))
    })
  })
}

function authoriseUserAccount(req, res, next) {
  console.log("YEAAAAAAA");
  const userReq = req.body;
  let user;

  findUserAccount(userReq)
    .then(foundUser => {
      user = foundUser;
      return checkPassword(userReq.password, foundUser.password)
        .then((res) => createToken())
        .then(token => updateUserToken(token, user))
        .then(() => {
          delete user.password;
          res.status(200).json();
        })
        .catch((err) => {
          console.log("Password check failed. Error: ", err);
          res.status(401).json()
        })
    })
    .catch((err) => {
      console.error("User account not found. Error: ", err);
      res.status(401).json()
    })
}

function findUserAccount(userReq) {
  const query = "SELECT * FROM userAccount WHERE emailAddress = '" + userReq.emailAddress + "'";
  return db.any(query)
    .then((data) => data[0])
}

function checkPassword(reqPassword, password) {
  return new Promise((resolve, reject) =>
    bcrypt.compare(reqPassword, password, (err, response) => {
      if (err) {
        reject(err)
      }
      else if (response) {
        resolve(response)
      } else {
        reject(new Error('Passwords do not match.'))
      }
    })
  )
}

function updateUserToken(token, user) {
  const query = "UPDATE userAccount SET token = '" + token + "' WHERE userID = " + user.userid + " RETURNING userID, emailAddress, token";
  return db.any(query)
    .then((data) => data[0])
    .catch(function error(err) {
      console.log(err)
    });

}

function createMoodDiary(req, res, next) {
  let diary = req.body;
    const query = "INSERT INTO MoodDiary(userEmail, diaryDate, diaryTime, diaryMood, diaryCategory, diaryDescription) " +
      "VALUES('" + diary.userEmail + "','" + diary.diaryDate + "','" + diary.diaryTime + "','" + diary.diaryMood + "','" +
      diary.diaryCategory + "','" + diary.diaryDescription + "');";

    console.log(query);

    db.any(query)
      .then(function resolve(data) {
        res.status(200).send(data);
      })
      .catch(function error(err) {
        return next(err);
      })
      .then(function resolve(data) {
      delete user.password_digest;
      })
      .catch(function error(err) {
      })
}

function getUserMoodDiaries(req, res, next) {
  db.any('SELECT diaryid, useremail, to_char(diarydate, \'DD Mon YYYY\') as diarydate, diarytime, diarymood, diarycategory, diarydescription, diarypublished FROM MoodDiary WHERE userEmail = $1', req.params.userEmail)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: dbToApp.sortMoodDiaries(data),
          message: 'Retrieved user mood diaries'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function deleteMoodDiary(req, res, next) {
  db.result('DELETE FROM MoodDiary where diaryID = $1', req.params.diaryID)
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .json({
          status: 'success',
          message: `Removed ${result.rowCount} mood diary`
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function updateMoodDiary(req, res, next) {
  db.none('UPDATE MoodDiary SET diarydate=$1, diarytime=$2, diarymood=$3, diarycategory=$4, diarydescription=$5 WHERE diaryid=$6',
    [req.body.diaryDate, req.body.diaryTime, req.body.diaryMood, req.body.diaryCategory, req.body.diaryDescription, req.params.diaryID])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated mood diary'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getMoodDiaryPublishState(diaryID) {
  const query = "SELECT diarypublished FROM MoodDiary WHERE diaryid = " + diaryID;
  return db.any(query)
    .then((data) => data[0])
}

function toggleMoodDiaryPublishState(req, res, next) {
  let newPublishState = '';

  getMoodDiaryPublishState(req.params.diaryID)
    .then(publishData => {
      if (publishData.diarypublished != 'Yes') {
        newPublishState = 'Yes';
      } else {
        newPublishState = 'No';
      } return db.none('UPDATE MoodDiary SET diarypublished=$1 WHERE diaryid=$2',
    [newPublishState, req.params.diaryID])
      .then(function () {
        console.log("This should be after");
        res.status(200)
          .json({
            status: 'Success - Toggled mood diary publish state',
            message: newPublishState
          });
      })
      .catch(function (err) {
        return next(err);
      });
})}

function getUserMoodCalendarDataLastOneDay(req, res, next) {
  db.any('SELECT diaryid, diarydate, diarymood FROM mooddiary WHERE useremail=$1 AND (diarydate <= CURRENT_DATE) AND (diarydate > date_trunc(\'day\', NOW() - interval \'1 day\'))', req.params.userEmail)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: dbToApp.sortMoodDiaries(data),
          message: 'Retrieved user mood metrics for last day'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getUserMoodCalendarDataLastOneWeek(req, res, next) {
  db.any('SELECT diaryid, to_char(diarydate, \'DD-MM-YYYY\') as diarydate, diarymood FROM mooddiary WHERE useremail=$1 AND (diarydate <= CURRENT_DATE) AND (diarydate > date_trunc(\'day\', NOW() - interval \'1 week\'))', req.params.userEmail)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: dbToApp.sortOneWeekMoodCalendarData(data),
          message: 'Retrieved user mood metrics for last week'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getUserMoodCalendarDataLastSixMonths(req, res, next) {
  db.any('SELECT diaryid, to_char(diarydate, \'DD Mon YYYY\') as diarydate, diarymood FROM mooddiary WHERE useremail=$1 AND (diarydate <= CURRENT_DATE) AND (diarydate > date_trunc(\'day\', NOW() - interval \'6 months\'))', req.params.userEmail)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: dbToApp.sortSixMonthMoodCalendarData(data),
          message: 'Retrieved user mood metrics for last 6 months'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getRecommendationsMetaDataForUser(req, res, next) {
  db.any('SELECT diaryid, diarycategory, diarymood FROM mooddiary WHERE userEmail = $1', req.params.userEmail)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: dbToApp.processRecommendationsMetaData(data),
          message: 'Retrieved user recommendations metadata'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getCommunityNavigatorDetails(req, res, next) {
  let communityNavigatorDetails = {};
  db.any('SELECT * FROM useraccount WHERE emailaddress = $1', req.params.userEmail)
    .then(function (data) {
      communityNavigatorDetails.navigatorID = data[0].navigatorid;
      db.any('SELECT * FROM communitynavigator WHERE navigatorid = $1', communityNavigatorDetails.navigatorID)
        .then(function (data) {
          communityNavigatorDetails.navigatorEmail = data[0].navigatoremail;
          communityNavigatorDetails.forename = data[0].forename;
          communityNavigatorDetails.surname = data[0].surname;
          communityNavigatorDetails.phoneNumber = data[0].phonenumber;
          db.any('SELECT gppracticeaddress FROM generalpractitioner WHERE navigatorid = $1', communityNavigatorDetails.navigatorID)
            .then(function (data) {
              communityNavigatorDetails.officeAddress = data[0].gppracticeaddress;
              res.status(200)
                .json({
                  status: 'success',
                  data: communityNavigatorDetails,
                  message: 'Retrieved user community navigator details.'
                });
            })
        })
    })
    .catch(function (err) {
      return next(err);
    });
}

function getUserHelpfulInformationPageDetails(req, res, next) {
  let helpfulInformationDetails = {};
  db.any('SELECT * FROM useraccount WHERE emailaddress = $1', req.params.userEmail)
    .then(function (data) {
      helpfulInformationDetails.practitionerID = data[0].practitionerid;
      db.any('SELECT * FROM generalpractitioner WHERE practitionerid = $1', helpfulInformationDetails.practitionerID)
        .then(function (data) {
          helpfulInformationDetails.gpPractice = data[0].gppractice;
          helpfulInformationDetails.generalPractitionerForename = data[0].forename;
          helpfulInformationDetails.generalPractitionerSurname = data[0].surname;
          helpfulInformationDetails.gpPracticeAddress = data[0].gppracticeaddress;
          helpfulInformationDetails.gpPracticePhone = data[0].phonenumber;
          helpfulInformationDetails.gpPracticeWebsite = data[0].practicewebsite;
          db.any('SELECT * FROM communitynavigator WHERE navigatorid = $1', helpfulInformationDetails.practitionerID)
            .then(function (data) {
              helpfulInformationDetails.communityNavigatorForename = data[0].forename;
              helpfulInformationDetails.communityNavigatorSurname = data[0].surname;
              helpfulInformationDetails.communityNavigatorEmail = data[0].navigatoremail;
              helpfulInformationDetails.communityNavigatorPhone = data[0].phonenumber;
              res.status(200)
                .json({
                  status: 'success',
                  data: helpfulInformationDetails,
                  message: 'Retrieved user profilePage details.'
                });
            })
        })
    })
    .catch(function (err) {
      return next(err);
    });
}

function getUserProfilePageDetails(req, res, next) {
  let profilePageDetails = {};
  db.any('SELECT * FROM useraccount WHERE emailaddress = $1', req.params.userEmail)
    .then(function (data) {
      profilePageDetails.forename = data[0].forename;
      profilePageDetails.surname = data[0].surname;
      profilePageDetails.practitionerID = data[0].practitionerid;
      db.any('SELECT * FROM generalpractitioner WHERE practitionerid = $1', profilePageDetails.practitionerID)
        .then(function (data) {
          console.log(data);
          profilePageDetails.gpPractice = data[0].gppractice;
          profilePageDetails.generalPractitionerForename = data[0].forename;
          profilePageDetails.generalPractitionerSurname = data[0].surname;
          db.any('SELECT * FROM communitynavigator WHERE navigatorid = $1', profilePageDetails.practitionerID)
            .then(function (data) {
              profilePageDetails.communityNavigatorForename = data[0].forename;
              profilePageDetails.communityNavigatorSurname = data[0].surname;
              res.status(200)
                .json({
                  status: 'success',
                  data: profilePageDetails,
                  message: 'Retrieved user profilePage details.'
                });
            })
        })
    })
    .catch(function (err) {
      return next(err);
    });
}

module.exports = {
  createUserAccount: createUserAccount,
  authoriseUserAccount: authoriseUserAccount,
  createMoodDiary: createMoodDiary,
  getUserMoodDiaries: getUserMoodDiaries,
  deleteMoodDiary: deleteMoodDiary,
  updateMoodDiary: updateMoodDiary,
  toggleMoodDiaryPublishState: toggleMoodDiaryPublishState,
  getUserMoodCalendarDataLastOneDay: getUserMoodCalendarDataLastOneDay,
  getUserMoodCalendarDataLastOneWeek: getUserMoodCalendarDataLastOneWeek,
  getUserMoodCalendarDataLastSixMonths: getUserMoodCalendarDataLastSixMonths,
  getRecommendationsMetaDataForUser: getRecommendationsMetaDataForUser,
  getCommunityNavigatorDetails: getCommunityNavigatorDetails,
  getUserProfilePageDetails: getUserProfilePageDetails,
  getUserHelpfulInformationPageDetails: getUserHelpfulInformationPageDetails
};


