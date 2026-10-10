export type AtlasBounds={x:number;y:number;width:number;height:number};
// Generated sheets may have unequal transparent gutters. Find empty separators rather
// than cutting a shield/banner at a fixed half-width. Source pixels remain untouched.
export function atlasBounds(pixels:ArrayLike<number>,width:number,height:number):AtlasBounds[]{
 const rows=new Int32Array(height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>96)rows[y]++;
 const divider=(counts:Int32Array)=>{const mid=Math.floor(counts.length/2);for(let d=0;d<counts.length*.2;d++)for(const v of [mid+d,mid-d])if(v>0&&v<counts.length&&counts[v]===0)return v;return mid;};
 const cutY=divider(rows),result:AtlasBounds[]=[];
 for(const [y0,y1]of [[0,cutY],[cutY,height]]){
  const cols=new Int32Array(width);for(let y=y0;y<y1;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>96)cols[x]++;
  const cutX=divider(cols);
  for(const [x0,x1]of [[0,cutX],[cutX,width]]){
   let left=x1,top=y1,right=x0-1,bottom=y0-1;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*width+x)*4+3]>96){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<left||bottom<top)throw new Error('Empty forest atlas cell');
   result.push({x:left,y:top,width:right-left+1,height:bottom-top+1});
  }
 }return result;
}
