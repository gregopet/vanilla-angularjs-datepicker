module = angular.module 'calendar', []
moment.lang('sl')

# Need concrete objects so ampm select can compare them by reference
AM = 'am'
PM = 'pm'

# Demo view controller
window.testController = ($scope) ->
	$scope.someDate = new Date()
	$scope.ampm = true
	$scope.languages = ['en', 'de', 'sl']
	$scope.$watch 'selectedLang', (lang) -> moment.lang(lang)
	
	$scope.setAm = () -> 
		$scope.someDate = moment().set('hours', 3)
	$scope.setPm = () -> 
		$scope.someDate = moment().set('hours', 17)

# Actual directives
module.directive 'hourInput', ($timeout) ->
	require  : 'ngModel'
	restrict : 'A'
	scope    :
		ngModel      : '=' #date!
		ampm         : '='
		selectedAmpm : '='
		
	link     : ($scope, element, attrs, ngModel) ->
		# prevents digest loops on programmatic settings
		surpressAmpmWatch = false
		
		# Transform date's hours to input values
		hourFormatter = (data) -> 
			hours = data.hours()
			if $scope.ampm
				$scope.selectedAmpm = if data.hours() >= 12 then PM else AM # set AM/PM on programmatic set
				surpressAmpmWatch = true
				$timeout (() -> surpressAmpmWatch = false ), 0
				if hours > 12 then return hours - 12
				if hours == 0 then return 12
				return hours
			else
				return hours
		ngModel.$formatters.push hourFormatter
		
		# Update view as am/pm mode changes
		$scope.$watch 'ampm', -> element.val(hourFormatter($scope.ngModel))
		
		# Update model & view as am/pm value changes
		$scope.$watch 'selectedAmpm', (newAmpm, oldAmpm) ->
			return unless newAmpm and $scope.ampm and !surpressAmpmWatch
			oldhours = $scope.ngModel.hours()
			if newAmpm == AM then $scope.ngModel = $scope.ngModel.clone().hours(oldhours - 12)
			else $scope.ngModel = $scope.ngModel.clone().hours(oldhours + 12)
			
		# Transform input into date changes
		ngModel.$parsers.push (data) ->
			dataNum = parseInt(data, 10)
			if $scope.ampm
				if isNaN(dataNum) or dataNum < 0 or dataNum > 12
					ngModel.$setValidity('hourInput', false)
					return $scope.ngModel # do not modify date on invalid input
				ngModel.$setValidity('hourInput', true)
				if $scope.selectedAmpm == PM and dataNum != 12 then dataNum += 12
				else if $scope.selectedAmpm == AM and dataNum == 12 then dataNum -= 12
				return $scope.ngModel.hours(dataNum)
			else
				if isNaN(dataNum) or dataNum < 0 or dataNum > 23
					ngModel.$setValidity('hourInput', false)
					return $scope.ngModel # do not modify date on invalid input
				$scope.selectedAmpm = if dataNum >= 12 then PM else AM # set AM/PM on user input
				ngModel.$setValidity('hourInput', true)
				return $scope.ngModel.clone().hours(dataNum)
	
	
module.directive 'calendar', () ->
	scope:
		date       : '='
		timepicker : '='
		ampm       : '='
	template: "
	<div class='datepicker'>
		<table>
			<thead>
				<tr class='displayed-month'>
					<td class='prev' ng-click='moveDisplayedMonth(-1)'>&lt;</td>
					<td class='month-name' colspan='5' >{{displayedMonth.format('MMMM YYYY')}}</td>
					<td class='next' ng-click='moveDisplayedMonth(1)'>&gt;</td>
				</tr>
			</thead>
			<tbody>
				<tr class='days-in-month'>
					<td class='dow' ng-repeat='day in daysInMonth'>{{ day }}</td>
				</tr>
				<tr class='week' ng-repeat='week in weekEnum'>
					<td class='day' ng-repeat='day in [0, 1, 2, 3, 4, 5, 6]' ng-class='applyClasses(daysOfMonth[week * 7 + day])' ng-click='selectDay(daysOfMonth[week * 7 + day])'>
						{{ daysOfMonth[week * 7 + day].date() }}
					</td>
				</tr>
				<tr class='timepicker' ng-show='timepicker'>
					<td colspan='7'>
						<input hour-input ng-model='date' class='hour-selector' ampm='ampm' selected-ampm='selectedAmpm' ng-required='true'></input>
						:
						<input ng-model='selectedMinute' class='minute-selector' ng-required='true'></input>
						<select ng-show='ampm' ng-model='selectedAmpm' ng-options='s.toString() for s in ampmVals' ng-change='switchAmpm(selectedAmpm)'>
						</select>
					</td>
				</tr>
			</tbody>
		</table>
	</div>"
	controller: ($scope) ->
		# TODO: determine proper names for am/pm from language!
		$scope.ampmVals = [ AM, PM ]
		
		# Watch for language changes in the library
		$scope.moment = moment
		$scope.$watch 'moment.langData()', () -> 
			aMoment = moment()
			$scope.daysInMonth = (aMoment.weekday(day).format('dd') for day in [0...7]) # day of week strings
		
		# Keep the start of selected day in scope.selectedDay
		# Keep the start of displayed month in scope.displayedMonth
		$scope.$watch 'date', (date, oldDate) ->
			if date
				if date.constructor.name == 'Date'
					$scope.date = moment(date) # triggers new watch event
				else 
					$scope.selectedDay = date.clone().startOf('day')
					$scope.displayedMonth = date.clone().startOf('month')
					$scope.selectedMinute = date.minutes()

		# Rebuild calendar if displayed month changes
		$scope.$watch 'displayedMonth', (displayedMonth) ->
			if displayedMonth # build a nice grid
				startAt = - displayedMonth.weekday() % 7
				endAt = Math.ceil((displayedMonth.daysInMonth() - startAt) / 7) * 7 + startAt - 1
				$scope.daysOfMonth = (displayedMonth.clone().add('days', d) for d in [startAt..endAt])
				$scope.weekEnum = [0...$scope.daysOfMonth.length / 7]
		
		# Watching minutes, they're easy compared to hours (though input validation wouldn't hurt)
		$scope.$watch 'selectedMinute', (newMinute) -> 
			newMinute = parseInt(newMinute, 10)
			return if isNaN(newMinute) or newMinute > 59  # can only happen if input is coming from input
			unless isNaN(newMinute) or $scope.date.constructor.name == 'Date' or isNaN(newMinute) or newMinute >= 60
				$scope.date = $scope.date.clone()
				$scope.date.minutes(newMinute)
				
		# Style day
		$scope.applyClasses = (day) ->
			active        : Math.abs(day.diff($scope.date, 'hours')) < 24 and day.date() == $scope.date.date()
			today           : Math.abs(day.diff(new Date(), 'hours')) < 24 and day.date() == moment().date()
			'old'           : day.year() < $scope.displayedMonth.year() or day.year() == $scope.displayedMonth.year() and day.month() < $scope.displayedMonth.month()
			'new'           : day.year() > $scope.displayedMonth.year() or day.year() == $scope.displayedMonth.year() and day.month() > $scope.displayedMonth.month()
		
		# Interaction functions
		$scope.selectDay = (day) -> 
			selected = day.clone().hours($scope.date.hours()).minutes($scope.date.minutes())
			$scope.date = selected
			
		$scope.moveDisplayedMonth = (delta) ->
			$scope.displayedMonth = $scope.displayedMonth.clone().add('months', delta)