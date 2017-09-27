const TimeUtil = {
    getweekFirstTime : function(date){
        if(!date) {
            date = new Date();
        }
        let day = date.getDay();
        date.setDate(date.getDate() - day);
        this.setFirst(date);
        return date.getTime();
    },
    getWeekEndTime : function(date){
        if(!date) {
            date = new Date();
        }
        let day = date.getDay();
        date.setDate(date.getDate()+6-day);
        this.setEnd(date);
        return date.getTime();
    },
    getMonthFirstTime : function(date){
        if(!date) {
            date = new Date();
        }
        date.setDate(1);
        this.setFirst(date);
        return date.getTime();
    },
    getMonthEndTime : function(date){
        if(!date) {
            date = new Date();
        }
        date.setMonth(date.getMonth()+1);
        date.setDate(0);
        this.setEnd(date);
        return date.getTime();
    },
    setFirst(date){
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(1);
        return date;
    },
    setEnd(date){
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
        return date;
    },
    getDayFirstTime(date) {
        let d = new Date(date);
        return this.setFirst(d);
    },
    getDayEndTime(date) {
        let d = new Date(date);
        return d.setEnd();
    },
    formatDay(date){
        date = new Date(date);
        date.setHours(date.getHours()+8)
        return date.getFullYear()+"-"+(date.getMonth()+1+"") + "-"+ date.getDate();
    },
 
    toNumberTwo(number){
        return number > 9 ? number+"" : "0"+number
    }
}

export  {
    TimeUtil
}
