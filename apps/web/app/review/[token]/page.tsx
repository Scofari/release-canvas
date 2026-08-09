import { GuestReview } from './guest-review';
export const metadata={title:'Guest review',robots:{index:false,follow:false}};
export default async function GuestReviewPage({params}:{params:Promise<{token:string}>}){const {token}=await params;return <GuestReview token={token}/>;}
