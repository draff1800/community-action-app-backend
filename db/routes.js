const obj = {name: 'justin', hobby: 'programming'};
const db = require('./queries');
const user = require('../models/userAccount.js');

const sendResponse = (res, err, data, status) => {
  if (err) {
    res.status(400).send(err);
  } else {
    res.status(status).send(data);
  }
};

module.exports = (app) => {
  app.route('/test')
    .get((req, res) => {
      sendResponse(res, null, obj, 200);
    });

  // API endpoints
  app.post('/register', db.createUserAccount);
  app.post('/login', db.authoriseUserAccount);
  app.post('/createMoodDiary', db.createMoodDiary);
  app.get('/getUserMoodDiaries/:userEmail', db.getUserMoodDiaries);
  app.delete('/deleteMoodDiary/:diaryID', db.deleteMoodDiary);
  app.put('/updateMoodDiary/:diaryID', db.updateMoodDiary);
  app.put('/toggleMoodDiaryPublishState/:diaryID', db.toggleMoodDiaryPublishState);
  app.get('/getUserMoodCalendarDataLastOneDay/:userEmail', db.getUserMoodCalendarDataLastOneDay);
  app.get('/getUserMoodCalendarDataLastOneWeek/:userEmail', db.getUserMoodCalendarDataLastOneWeek);
  app.get('/getUserMoodCalendarDataLastSixMonths/:userEmail', db.getUserMoodCalendarDataLastSixMonths);
  app.get('/getRecommendationsMetaDataForUser/:userEmail', db.getRecommendationsMetaDataForUser);
  app.get('/getCommunityNavigatorDetails/:userEmail', db.getCommunityNavigatorDetails);
  app.get('/getUserProfilePageDetails/:userEmail', db.getUserProfilePageDetails),
  app.get('/getUserHelpfulInformationPageDetails/:userEmail', db.getUserHelpfulInformationPageDetails)
};


