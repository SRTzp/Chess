import {bestMove,Match,type ChessSave,type OpponentTier} from './chess';
self.onmessage=(event:MessageEvent<{id:number;save:ChessSave;tier:OpponentTier}>)=>{
 const {id,save,tier}=event.data;
 const match=Match.restore(save);
 self.postMessage({id,move:match?bestMove(match.chess,tier):null});
};
