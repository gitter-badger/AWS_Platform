import { Success, Fail, Codes, Tables, JwtVerify,JSONParser } from './lib/all'
const jwt = require('jsonwebtoken')
const TOKEN_SECRET = 'gsy0913'
const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res,code=Codes.Error) => callback(null, Fail(res,code))
export const initData = async (e,c,cb)=>{
  return cb(null,Success({m:'initData'}))
}

export const jwtverify = async(e,c,cb) =>{
  console.log('methodArn:',e.methodArn);
  // get the token from event.authorizationToken
  const token = e.authorizationToken.split(' ')
  if (token[0] !== 'Bearer') {
    return c.fail('Unauthorized: wrong token type')
  }
  // verify it and return the policy statements
  const [err, userInfo] = await JwtVerify(token[1])
  if (err || !userInfo) {
    console.log(JSON.stringify(err),JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }

  c.succeed(generatePolicyDocument('user','Allow',e.methodArn))

}
export const generateToken = async (e,c,cb) =>{
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb,{err:jsonParseErr},jsonParseErr.code)
  }
  const token = jwt.sign(userInfo,TOKEN_SECRET,{expiresIn: '1d'})

  return ResOK(cb,{
    payload:token
  })
}
function generatePolicyDocument(principalId, effect, resource) {
	var authResponse = {};
	authResponse.principalId = principalId;
	if (effect && resource) {
		var policyDocument = {};
		policyDocument.Version = '2012-10-17'; // default version
		policyDocument.Statement = [];
		var statementOne = {};
		statementOne.Action = 'execute-api:Invoke'; // default action
		statementOne.Effect = effect;
		statementOne.Resource = resource;
		policyDocument.Statement[0] = statementOne;
		authResponse.policyDocument = policyDocument;
	}
	return authResponse;
}
