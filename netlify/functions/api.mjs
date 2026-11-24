import {getUser} from '@netlify/identity';
import {getDatabase} from '@netlify/database';
import core from '../generated/api-core.mjs';
import {createDatabase} from '../lib/database.mjs';
import {createHandler} from '../lib/handler.mjs';

export default createHandler({core,getUser,getDatabase:()=>createDatabase(getDatabase().pool)});
export const config={path:'/api/*'};
