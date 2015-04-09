function Response(){
  this.ErrorNo = 1001;
  this.ErrorDesc = "Bad stuff has happened";
  this.Payload = null;
}

Response.prototype = {
  success :  function(rtnObj){
    this.ErrorNo = 0;
    this.ErrorDesc = "";
    this.Payload = rtnObj;
  }
}

module.exports = Response;