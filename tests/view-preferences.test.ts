import {test} from 'node:test';import assert from 'node:assert/strict';
import {restorePreferences,viewPreferences,changePreferences} from '../chapter/src/learning/preferences';
test('view preferences default to OS motion and reject malformed overrides independently',()=>{
 for(const os of [true,false])assert.deepEqual(viewPreferences(restorePreferences(null),'akin',os),{symbols:false,reducedMotion:os});
 const invalid=restorePreferences({version:1,profiles:{akin:{symbols:'true',reducedMotion:0},prin:{symbols:true,reducedMotion:false}}});assert.deepEqual(viewPreferences(invalid,'akin',true),{symbols:false,reducedMotion:true});assert.deepEqual(viewPreferences(invalid,'prin',true),{symbols:true,reducedMotion:false});
 assert.deepEqual(restorePreferences({version:99,profiles:{akin:{symbols:true}}}),{version:1,profiles:{}});
});
test('preferences survive serialization and isolate profiles without carrying game/reward fields',()=>{
 const game={moves:['e4'],rewards:['master']};let settings=restorePreferences({version:1,profiles:{akin:{symbols:false}},game});settings=changePreferences(settings,'akin',{reducedMotion:true});settings=changePreferences(settings,'prin',{symbols:true,reducedMotion:false});
 const reloaded=restorePreferences(JSON.parse(JSON.stringify(settings)));assert.deepEqual(viewPreferences(reloaded,'akin',false),{symbols:false,reducedMotion:true});assert.deepEqual(viewPreferences(reloaded,'prin',true),{symbols:true,reducedMotion:false});assert.deepEqual(game,{moves:['e4'],rewards:['master']});assert(!('game'in reloaded));
});
