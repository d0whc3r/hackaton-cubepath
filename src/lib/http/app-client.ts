import wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'

export const appWretch = wretch().addon(QueryStringAddon)
