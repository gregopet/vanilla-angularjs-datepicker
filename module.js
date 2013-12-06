// Generated by CoffeeScript 1.3.3
(function() {
  var AM, PM, module;

  module = angular.module('calendar', []);

  moment.lang('sl');

  AM = 'am';

  PM = 'pm';

  window.testController = function($scope) {
    $scope.someDate = new Date();
    $scope.ampm = true;
    $scope.languages = ['en', 'de', 'sl'];
    $scope.$watch('selectedLang', function(lang) {
      return moment.lang(lang);
    });
    $scope.setAm = function() {
      return $scope.someDate = moment().set('hours', 3);
    };
    return $scope.setPm = function() {
      return $scope.someDate = moment().set('hours', 17);
    };
  };

  module.directive('hourInput', function($timeout) {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {
        ngModel: '=',
        ampm: '=',
        selectedAmpm: '='
      },
      link: function($scope, element, attrs, ngModel) {
        var hourFormatter, surpressAmpmWatch;
        surpressAmpmWatch = false;
        hourFormatter = function(data) {
          var hours;
          hours = data.hours();
          if ($scope.ampm) {
            $scope.selectedAmpm = data.hours() >= 12 ? PM : AM;
            surpressAmpmWatch = true;
            $timeout((function() {
              return surpressAmpmWatch = false;
            }), 0);
            if (hours > 12) {
              return hours - 12;
            }
            if (hours === 0) {
              return 12;
            }
            return hours;
          } else {
            return hours;
          }
        };
        ngModel.$formatters.push(hourFormatter);
        $scope.$watch('ampm', function() {
          return element.val(hourFormatter($scope.ngModel));
        });
        $scope.$watch('selectedAmpm', function(newAmpm, oldAmpm) {
          var oldhours;
          if (!(newAmpm && $scope.ampm && !surpressAmpmWatch)) {
            return;
          }
          oldhours = $scope.ngModel.hours();
          if (newAmpm === AM) {
            return $scope.ngModel = $scope.ngModel.clone().hours(oldhours - 12);
          } else {
            return $scope.ngModel = $scope.ngModel.clone().hours(oldhours + 12);
          }
        });
        return ngModel.$parsers.push(function(data) {
          var dataNum;
          dataNum = parseInt(data, 10);
          if ($scope.ampm) {
            if (isNaN(dataNum) || dataNum < 0 || dataNum > 12) {
              ngModel.$setValidity('hourInput', false);
              return $scope.ngModel;
            }
            ngModel.$setValidity('hourInput', true);
            if ($scope.selectedAmpm === PM && dataNum !== 12) {
              dataNum += 12;
            } else if ($scope.selectedAmpm === AM && dataNum === 12) {
              dataNum -= 12;
            }
            return $scope.ngModel.hours(dataNum);
          } else {
            if (isNaN(dataNum) || dataNum < 0 || dataNum > 23) {
              ngModel.$setValidity('hourInput', false);
              return $scope.ngModel;
            }
            $scope.selectedAmpm = dataNum >= 12 ? PM : AM;
            ngModel.$setValidity('hourInput', true);
            return $scope.ngModel.clone().hours(dataNum);
          }
        });
      }
    };
  });

  module.directive('calendar', function() {
    return {
      scope: {
        date: '=',
        timepicker: '=',
        ampm: '='
      },
      template: "	<div class='datepicker'>		<table>			<thead>				<tr class='displayed-month'>					<td class='prev' ng-click='moveDisplayedMonth(-1)'>&lt;</td>					<td class='month-name' colspan='5' >{{displayedMonth.format('MMMM YYYY')}}</td>					<td class='next' ng-click='moveDisplayedMonth(1)'>&gt;</td>				</tr>			</thead>			<tbody>				<tr class='days-in-month'>					<td class='dow' ng-repeat='day in daysInMonth'>{{ day }}</td>				</tr>				<tr class='week' ng-repeat='week in weekEnum'>					<td class='day' ng-repeat='day in [0, 1, 2, 3, 4, 5, 6]' ng-class='applyClasses(daysOfMonth[week * 7 + day])' ng-click='selectDay(daysOfMonth[week * 7 + day])'>						{{ daysOfMonth[week * 7 + day].date() }}					</td>				</tr>				<tr class='timepicker' ng-show='timepicker'>					<td colspan='7'>						<input hour-input ng-model='date' class='hour-selector' ampm='ampm' selected-ampm='selectedAmpm' ng-required='true'></input>						:						<input ng-model='selectedMinute' class='minute-selector' ng-required='true'></input>						<select ng-show='ampm' ng-model='selectedAmpm' ng-options='s.toString() for s in ampmVals' ng-change='switchAmpm(selectedAmpm)'>						</select>					</td>				</tr>			</tbody>		</table>	</div>",
      controller: function($scope) {
        $scope.ampmVals = [AM, PM];
        $scope.moment = moment;
        $scope.$watch('moment.langData()', function() {
          var aMoment, day;
          aMoment = moment();
          return $scope.daysInMonth = (function() {
            var _i, _results;
            _results = [];
            for (day = _i = 0; _i < 7; day = ++_i) {
              _results.push(aMoment.weekday(day).format('dd'));
            }
            return _results;
          })();
        });
        $scope.$watch('date', function(date, oldDate) {
          if (date) {
            if (date.constructor.name === 'Date') {
              return $scope.date = moment(date);
            } else {
              $scope.selectedDay = date.clone().startOf('day');
              $scope.displayedMonth = date.clone().startOf('month');
              return $scope.selectedMinute = date.minutes();
            }
          }
        });
        $scope.$watch('displayedMonth', function(displayedMonth) {
          var d, endAt, startAt, _i, _ref, _results;
          if (displayedMonth) {
            startAt = -displayedMonth.weekday() % 7;
            endAt = Math.ceil((displayedMonth.daysInMonth() - startAt) / 7) * 7 + startAt - 1;
            $scope.daysOfMonth = (function() {
              var _i, _results;
              _results = [];
              for (d = _i = startAt; startAt <= endAt ? _i <= endAt : _i >= endAt; d = startAt <= endAt ? ++_i : --_i) {
                _results.push(displayedMonth.clone().add('days', d));
              }
              return _results;
            })();
            return $scope.weekEnum = (function() {
              _results = [];
              for (var _i = 0, _ref = $scope.daysOfMonth.length / 7; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
              return _results;
            }).apply(this);
          }
        });
        $scope.$watch('selectedMinute', function(newMinute) {
          newMinute = parseInt(newMinute, 10);
          if (isNaN(newMinute) || newMinute > 59) {
            return;
          }
          if (!(isNaN(newMinute) || $scope.date.constructor.name === 'Date' || isNaN(newMinute) || newMinute >= 60)) {
            $scope.date = $scope.date.clone();
            return $scope.date.minutes(newMinute);
          }
        });
        $scope.applyClasses = function(day) {
          return {
            active: Math.abs(day.diff($scope.date, 'hours')) < 24 && day.date() === $scope.date.date(),
            today: Math.abs(day.diff(new Date(), 'hours')) < 24 && day.date() === moment().date(),
            'old': day.year() < $scope.displayedMonth.year() || day.year() === $scope.displayedMonth.year() && day.month() < $scope.displayedMonth.month(),
            'new': day.year() > $scope.displayedMonth.year() || day.year() === $scope.displayedMonth.year() && day.month() > $scope.displayedMonth.month()
          };
        };
        $scope.selectDay = function(day) {
          var selected;
          selected = day.clone().hours($scope.date.hours()).minutes($scope.date.minutes());
          return $scope.date = selected;
        };
        return $scope.moveDisplayedMonth = function(delta) {
          return $scope.displayedMonth = $scope.displayedMonth.clone().add('months', delta);
        };
      }
    };
  });

}).call(this);