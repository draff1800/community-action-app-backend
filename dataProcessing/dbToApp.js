function sortMoodDiaries(data) {
  let diaryDates = new Set();
  let sortedDiaries = [];

  data.forEach(diaryEntry => diaryDates.add(diaryEntry.diarydate));

  diaryDates.forEach((date, index) => {
    let diaryGrouping = [];
    data.forEach(diaryEntry => {
      if (diaryEntry.diarydate == date) {
        diaryGrouping.push(diaryEntry)
      }
    });
    if (diaryGrouping.length > 0) {
      sortedDiaries.push(diaryGrouping);
    }
  });
  console.log(sortedDiaries);
  return sortedDiaries;
}

function sortSixMonthMoodCalendarData(data) {
  let calendarInput = [];
  let calendarInputLabels = getLastSixMonths();
  let calendarInputData = [];
  let monthDiaryGroupings = [];
  let diaryDates = new Set();

  data.forEach(diaryEntry => diaryDates.add(diaryEntry.diarydate.substring(3)));

  diaryDates.forEach((date, index) => {
    let monthDiaryGrouping = [];
    data.forEach(diaryEntry => {
      if (diaryEntry.diarydate.substring(3) == date) {
        monthDiaryGrouping.push(diaryEntry)
      }
    });
    if (monthDiaryGrouping.length > 0) {
      monthDiaryGroupings.push(monthDiaryGrouping);
    }
  });

  monthDiaryGroupings.forEach((monthDiaryGrouping) => {
    let monthlyMoodTotalScore = 0;

    monthDiaryGrouping.forEach((diaryEntry) => {
      monthlyMoodTotalScore += parseInt(diaryEntry.diarymood);
    });

    console.log(monthlyMoodTotalScore + "divided by" + monthDiaryGrouping.length);
    calendarInputData.push(({
      month: monthDiaryGrouping[0].diarydate.substring(3),
      averageMoodScore: monthlyMoodTotalScore / monthDiaryGrouping.length
    }));
    monthlyMoodTotalScore = 0;
  });

  calendarInput.push(calendarInputLabels);
  calendarInput.push(calendarInputData);

  return calendarInput;
}

function sortOneWeekMoodCalendarData(data) {
  let calendarInput = [];
  let calendarInputLabels = getLastSevenDays();
  let calendarInputData = [];
  let dayDiaryGroupings = [];
  let diaryDates = new Set();

  data.forEach(diaryEntry => diaryDates.add(diaryEntry.diarydate));

  diaryDates.forEach((date, index) => {
    let dayDiaryGrouping = [];
    data.forEach(diaryEntry => {
      if (diaryEntry.diarydate == date) {
        dayDiaryGrouping.push(diaryEntry)
      }
    });
    if (dayDiaryGrouping.length > 0) {
      dayDiaryGroupings.push(dayDiaryGrouping);
    }
  });

  dayDiaryGroupings.forEach((dayDiaryGrouping) => {
    let dailyMoodTotalScore = 0;

    dayDiaryGrouping.forEach((diaryEntry) => {
      dailyMoodTotalScore += parseInt(diaryEntry.diarymood);
    });

    console.log(dailyMoodTotalScore + "divided by" + dayDiaryGrouping.length);
    calendarInputData.push(({
      day: dayDiaryGrouping[0].diarydate,
      averageMoodScore: dailyMoodTotalScore / dayDiaryGrouping.length
    }));
    dailyMoodTotalScore = 0;
  });

  calendarInput.push(calendarInputLabels);
  calendarInput.push(calendarInputData);

  return calendarInput;
}

function formatDate(date){
  let dd = date.getDate();
  let mm = date.getMonth()+1;
  let yyyy = date.getFullYear();
  if(dd<10) {dd='0'+dd}
  if(mm<10) {mm='0'+mm}
  date = dd+'-'+mm+'-'+yyyy;
  return date
}

function getLastSevenDays () {
  let days = [];
  for (let i=0; i<7; i++) {
    let d = new Date();
    d.setDate(d.getDate() - i);
    days.push( formatDate(d) )
  }

  return(days.join(','));
}

function getLastSixMonths() {
  let months = [];
  const monthNames = ["Jan 2020", "Feb 2020", "Mar 2020", "Apr 2020", "May 2020", "Jun 2020", "Jul 2020", "Aug 2020", "Sep 2020", "Oct 2020", "Nov 2020", "Dec 2019"];

  const today = new Date();
  let d;
  let month;

  for (let i = 6; i > 0; i -= 1) {
    d = new Date(today.getFullYear(), today.getMonth()+1 - i, 1);
    month = monthNames[d.getMonth()];
    months.push(month);
  }

  return months;
}

function processRecommendationsMetaData(data) {
  let metadata = [];
  let diaryEntryCount = data.length;
  let neutralOrNegativeEntries = [];
  let neutralOrNegativeEntryCount = 0;
  let neutralOrNegativeCategoryCounts = [{thoughts: 0}, {family: 0},{friends: 0},
    {relationships: 0},{hobbies: 0}, {school: 0}, {work: 0}];
  let recommendationThresholdsMet = [{thoughts: false}, {family: false},{friends: false},
    {relationships: false},{hobbies: false}, {school: false}, {work: false}];


  data.forEach((diaryEntry) => {
    if(diaryEntry.diarymood <= 3) {
      neutralOrNegativeEntries.push(diaryEntry);
      neutralOrNegativeEntryCount++;
    }
  });

  neutralOrNegativeEntries.forEach((diaryEntry) => {
    console.log(diaryEntry.diarycategory);
    switch (diaryEntry.diarycategory) {
      case "Thoughts":
        neutralOrNegativeCategoryCounts[0].thoughts++;
        break;
      case "Family":
        neutralOrNegativeCategoryCounts[1].family++;
        break;
      case "Friends":
        neutralOrNegativeCategoryCounts[2].friends++;
        break;
      case "Relationships":
        neutralOrNegativeCategoryCounts[3].relationships++;
        break;
      case "Hobbies & Activities":
        neutralOrNegativeCategoryCounts[4].hobbies++;
        break;
      case "School":
        neutralOrNegativeCategoryCounts[5].school++;
        break;
      case "Work":
        neutralOrNegativeCategoryCounts[6].work++;
        break;
    }
  });

  if(diaryEntryCount>=10 && neutralOrNegativeEntryCount >= 4 && ((neutralOrNegativeCategoryCounts[0].thoughts / neutralOrNegativeEntryCount) >= 0.25)) {
    recommendationThresholdsMet[0].thoughts = true;
  } if(diaryEntryCount>=10 && neutralOrNegativeEntryCount >= 4 && ((neutralOrNegativeCategoryCounts[1].family / neutralOrNegativeEntryCount) >= 0.25)) {
    recommendationThresholdsMet[1].family = true;
  } if(diaryEntryCount>=10 && neutralOrNegativeEntryCount >= 4 && ((neutralOrNegativeCategoryCounts[2].friends / neutralOrNegativeEntryCount) >= 0.25)) {
    recommendationThresholdsMet[2].friends = true;
  } if(diaryEntryCount>=10 && neutralOrNegativeEntryCount >= 4 && ((neutralOrNegativeCategoryCounts[3].relationships / neutralOrNegativeEntryCount) >= 0.25)) {
    recommendationThresholdsMet[3].relationships = true;
  } if(diaryEntryCount>=10 && neutralOrNegativeEntryCount >= 4 && ((neutralOrNegativeCategoryCounts[4].hobbies / neutralOrNegativeEntryCount) >= 0.25)) {
    recommendationThresholdsMet[4].hobbies = true;
  } if(diaryEntryCount>=10 && neutralOrNegativeEntryCount >= 4 && ((neutralOrNegativeCategoryCounts[5].school / neutralOrNegativeEntryCount) >= 0.25)) {
    recommendationThresholdsMet[5].school = true;
  } if(diaryEntryCount>=10 && neutralOrNegativeEntryCount >= 4 && ((neutralOrNegativeCategoryCounts[6].work / neutralOrNegativeEntryCount) >= 0.25)) {
    recommendationThresholdsMet[6].work = true;
  }

  metadata.push({diaryEntryCount: diaryEntryCount});
  metadata.push({neutralOrNegativeEntryCount: neutralOrNegativeEntryCount});
  metadata.push({recommendationThresholdsMet: recommendationThresholdsMet});

  return metadata;
}

module.exports = {
  sortMoodDiaries: sortMoodDiaries,
  sortOneWeekMoodCalendarData: sortOneWeekMoodCalendarData,
  sortSixMonthMoodCalendarData: sortSixMonthMoodCalendarData,
  getLastSevenDays: getLastSevenDays,
  getLastSixMonths: getLastSixMonths,
  processRecommendationsMetaData: processRecommendationsMetaData
};
