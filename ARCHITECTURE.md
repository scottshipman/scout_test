# Architecture Discussion

## When would you choose MongoDB over a relational database for a new feature? What factors influence this decision?

The top factors I would use to choose between a MongoDB over a relational one is the nature of how the data is frequently requested and if the data is variable, or the schema isnt reliably fixed, as with iterative development / agile. One example of this that is pretty generic, is that you want to be able to collect form submissions, where there can be many sets of forms with different sets of questions. A schema driven solution would require several tables mapping the Form to its questions and field types (so the data types in the DB also map). The variability of the data for MongoDB means you arent managing migrations and backwards compatibility in data (default values?). Since Mongo has the lookup, there is still an opportunity for some realtional querying, but a document style storage can be more flexible.

## Describe how you would implement a feature that needs to process 10,000 records nightly (e.g., sending reminder emails). What patterns/tools would you use and why?

I would implement a queue system to store and manage the jobs. If we are talking about Symfony, I would use the Scheduler and Messenger features. Otherwise, I have used AWS SQS for this as well. This solution provides asyncronous workers to add to the queue and then process them. Queues should have configured batch sizes as well, with multiple workers / threads, to minimize impact of any individual worker failure.

## A React component is re-rendering too frequently, causing performance issues. Walk through your debugging approach and potential solutions.

I would start by using the ReactDevTools and attempt to record the re-rendering and see if I could see what triggers or context is causing state change. I would also want to see if this is a DOM re-re-render or just the state trigger happening, even if no user impact. I would look at a useEffect dependency, and maybe also consider useMeme or useContext depending on the condition. In the task for the react component, it renders the whole list instead of any individual item, and thats an example of why this could happen - what if a user is quickly clicking the Complete button on every item.