import {test} from 'node:test';import assert from 'node:assert/strict';
import {forestTier,forestMove} from '../chapter/src/forest-adventure';
import {atlasBounds} from '../chapter/src/forest-atlas';
test('armor milestones use existing contiguous lessons, not repeated moves or sparse progress',()=>{
 const done=Array(12).fill(false);assert.equal(forestTier(done,'pawn'),'apprentice');done[5]=true;assert.equal(forestTier(done,'pawn'),'apprentice');done.fill(true,0,3);assert.equal(forestTier(done,'pawn'),'guardian');done.fill(true,0,6);assert.equal(forestTier(done,'pawn'),'master');assert.equal(forestTier(done,'knight'),'apprentice');done.fill(true,6,9);assert.equal(forestTier(done,'knight'),'guardian');done.fill(true);assert.equal(forestTier(done,'knight'),'master');assert.equal(forestTier(new Array(12),'pawn'),'apprentice');assert.equal(forestTier(done,'rook'),'apprentice');
});
test('knight measuring corners are never trail cells; pawn capture and rook trail stay exact',()=>{
 const n=forestMove('knight',{x:1,y:7},{x:2,y:5});assert.deepEqual(n?.trail,[]);assert.deepEqual(n?.measurement,[{x:1,y:7},{x:1,y:5},{x:2,y:5}]);assert.equal(forestMove('knight',{x:1,y:7},{x:2,y:6}),null);
 assert.deepEqual(forestMove('pawn',{x:2,y:4},{x:2,y:2})?.trail,[{x:2,y:4},{x:2,y:3},{x:2,y:2}]);assert.equal(forestMove('pawn',{x:2,y:4},{x:3,y:3}),null);assert(forestMove('pawn',{x:2,y:4},{x:3,y:3},true));assert.equal(forestMove('rook',{x:0,y:0},{x:2,y:2}),null);assert.equal(forestMove('rook',{x:0,y:0},{x:0,y:7})?.trail.length,8);
});
test('atlas framing follows transparent gutters and retains an arm across the nominal half',()=>{
 const w=20,h=20,p=new Uint8ClampedArray(w*h*4);const rect=(x0:number,y0:number,x1:number,y1:number)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)p[(y*w+x)*4+3]=255;};rect(2,2,7,7);rect(14,2,17,7);rect(2,12,12,17);rect(15,12,18,17);
 assert.deepEqual(atlasBounds(p,w,h),[{x:2,y:2,width:6,height:6},{x:14,y:2,width:4,height:6},{x:2,y:12,width:11,height:6},{x:15,y:12,width:4,height:6}]);assert.throws(()=>atlasBounds(new Uint8ClampedArray(w*h*4),w,h),/Empty/);
});
