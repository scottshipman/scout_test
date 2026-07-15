# User Controller Task

## Original Code (fixed the case issue from PDF)

```php
<?php
// UserController.php
class UserController extends AbstractController
{
    #[Route('/api/users/with-activity', methods: ['GET'])]
    public function getUsersWithActivity(EntityManagerInterface $em): JsonResponse
    {
        $users = $em->getRepository(User::class)->findAll();
        $result = [];

        foreach ($users as $user) {
            // Get user's recent logins
            $logins = $em->getRepository(LoginHistory::class)
                ->findBy(['user' => $user], ['loginAt' => 'DESC'], 5);

            // Get user's assigned studies
            $studies = $em->getRepository(StudyAssignment::class)
                ->findBy(['user' => $user, 'active' => true]);

            // Get user's pending tasks
            $tasks = $em->getRepository(Task::class)
                ->findBy(['assignedTo' => $user, 'status' => 'PENDING']);

            $result[] = [
                'id' => $user->getId(),
                'name' => $user->getFullName(),
                'email' => $user->getEmail(),
                'recentLogins' => array_map(fn($l) => $l->getLoginAt()->format('Y-m-d H:i'), $logins),
                'activeStudies' => count($studies),
                'pendingTasks' => count($tasks),
            ];
        }

        return $this->json($result);
    }
}
```

## What is the performance problem with this code?

The biggest issue is the N+1 looping over a findAll() request.
Doing a findAll with no pagination or limits is also an issue especially for an API endpoint.
This code also pulls back full entities, when only some fields, or counts are needed.
Also, I dont know if it was part of the exercise or not, but the font choice in the PDF was not very code-friendly, had to convert it before I could even work with it.

## How many database queries will this execute for 100 users?

301 queries, assuming the repository classes implement 1 query per usage each, and doesnt implement multiple queries and use an array_merge or some hydration before the repository class returns anything.

## Rewritten Code

```php
<?php
// UserController.php
class UserController extends AbstractController
{
    #[Route('/api/users/with-activity', methods: ['GET'])]
    public function getUsersWithActivity(
        EntityManagerInterface $em,
        Request $request
    ): JsonResponse {
        // Use Pagination for API endpoints
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(100, (int) $request->query->get('limit', 25)); // cap to prevent abuse

        $users = $em->createQueryBuilder()
            ->select('u.id', 'u.fullName', 'u.email')
            ->from(User::class, 'u')
            ->orderBy('u.id', 'ASC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getArrayResult(); // just get what we need

        if (empty($users)) {
            return $this->json([]);
        }

        $userIds = array_column($users, 'id');

        // Get all studies in one query with a where in keyed by user.id
        $studyCounts = $em->createQueryBuilder()
            ->select('IDENTITY(s.user) AS userId', 'COUNT(s.id) AS cnt')
            ->from(StudyAssignment::class, 's')
            ->where('s.user IN (:userIds)')
            ->andWhere('s.active = true')
            ->groupBy('s.user')
            ->setParameter('userIds', $userIds)
            ->getQuery()
            ->getResult();
        $studyCountsByUser = array_column($studyCounts, 'cnt', 'userId');

        // do the same for tasks where userID = assignedTo
        $taskCounts = $em->createQueryBuilder()
            ->select('IDENTITY(t.assignedTo) AS userId', 'COUNT(t.id) AS cnt')
            ->from(Task::class, 't')
            ->where('t.assignedTo IN (:userIds)')
            ->andWhere('t.status = :status')
            ->groupBy('t.assignedTo')
            ->setParameter('userIds', $userIds)
            ->setParameter('status', 'PENDING')
            ->getQuery()
            ->getResult();
        $taskCountsByUser = array_column($taskCounts, 'cnt', 'userId');

        // same concept, try to do one query for last 5 logins
        //    couldnt get DQL to work with a limit per user, so going with raw sql
        $conn = $em->getConnection();
        // this is the hardest part - trying to sort and limit without the limitations of Group By and still end up with one row each and return two columns
        $sql = '
            SELECT user_id, login_at
            FROM (
                SELECT
                    user_id,
                    login_at,
                    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_at DESC) AS rn 
                FROM login_history
                WHERE user_id IN (:userIds)
            ) ranked
            WHERE rn <= 5
            ORDER BY user_id, login_at DESC
        ';
        $loginRows = $conn->executeQuery(
            $sql,
            ['userIds' => $userIds],
            ['userIds' => ArrayParameterType::INTEGER]
        )->fetchAllAssociative();

        $loginsByUser = [];
        foreach ($loginRows as $row) {
            $loginsByUser[$row['user_id']][] = (new \DateTimeImmutable($row['login_at']))
                ->format('Y-m-d H:i');
        }

        // Put it all together
        $result = [];
        foreach ($users as $user) {
            $id = $user['id'];
            $result[] = [
                'id' => $id,
                'name' => $user['fullName'],
                'email' => $user['email'],
                'recentLogins' => $loginsByUser[$id] ?? [],
                'activeStudies' => (int) ($studyCountsByUser[$id] ?? 0),
                'pendingTasks' => (int) ($taskCountsByUser[$id] ?? 0),
            ];
        }

        return $this->json([
            'data' => $result,
            'page' => $page,
            'limit' => $limit,
        ]);
    }
}
```

---

# React Component Task

## Original Code (fixed the case issue from PDF)

```jsx
// UserDashboard.tsx
function UserDashboard({ userId }) {
  const [user, setUser] = useState(null);
  const [studies, setStudies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchStudies();
    fetchTasks();
  }, []);

  async function fetchUser() {
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json();
    setUser(data);
  }

  async function fetchStudies() {
    const res = await fetch(`/api/users/${userId}/studies`);
    const data = await res.json();
    setStudies(data);
  }

  async function fetchTasks() {
    const res = await fetch(`/api/users/${userId}/tasks`);
    const data = await res.json();
    setTasks(data);
  }

  function updateTaskStatus(taskId, status) {
    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    document.getElementById(`task-${taskId}`).classList.add('completed');
  }

  return (
    <div>
      <h1>{user.name}</h1>
      {studies.map(study => <div key={study.id}>{study.name}</div>)}
      {tasks.map(task => (
        <div id={`task-${task.id}`} key={task.id}>
          {task.title}
          <button onClick={() => updateTaskStatus(task.id, 'DONE')}>
            Complete
          </button>
        </div>
      ))}
    </div>
  );
}
```

## List all the issues you can identify (there are at least 6)

1. "Cannot read properties of null" because user is insitialized as null
2. loading is declared, but it doesnt seem to ever be used or set functionally.
3. useEffect doesnt pass a dependency except an empty array, so it probably wont update the render after first mount
4. its making api calls but doesnt handle 4/500 errors so res.json may cause an error or just not what we expect.
5. if the api call to update a task status fails, it still updates the DOM directly, without waiting. I dont think it will re-render so virtual DOM sync doesnt matter
6. the component doesnt appear to show a task status, just a button to mark complete('done'). I dont know fully what is actually returned as data for tasks, and I assume its returning all statuses, not just ones not done.

## Rewritten Code

```jsx
// UserDashboard.tsx
function UserDashboard({ userId }) {
  const [user, setUser] = useState(null);
  const [studies, setStudies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUser(), fetchStudies(), fetchTasks()]);
      } catch (err) {
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    async function fetchUser() {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error(`Failed to load user (${res.status})`);
      const data = await res.json();
      if (!isCancelled) setUser(data);
    }

    async function fetchStudies() {
      const res = await fetch(`/api/users/${userId}/studies`);
      if (!res.ok) throw new Error(`Failed to load studies (${res.status})`);
      const data = await res.json();
      if (!isCancelled) setStudies(data);
    }

    async function fetchTasks() {
      const res = await fetch(`/api/users/${userId}/tasks`);
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
      const data = await res.json();
      if (!isCancelled) setTasks(data);
    }

    loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  async function updateTaskStatus(taskId, status) {
    // just in case, lets keep the original
    const previousTasks = tasks;
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`Failed to update task (${res.status})`);
    } catch (err) {
      // Roll back if there is an error
      setTasks(previousTasks);
      setError(err.message);
    }
  }

  // since we declared it, lets use it
  if (loading) return <div>Loading...</div>;

  if (error) return <div>Error: {error}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>

      <div className="studies-section">
        <h2>Studies</h2>
        {studies.map(study => <div key={study.id}>{study.name}</div>)}
      </div>

      <div className="tasks-section">
        <h2>Tasks</h2>
        {tasks.map(task => (
          <div
            key={task.id}
            className={task.status === 'DONE' ? 'completed' : undefined}
          >
            <span>{task.title}</span>
            <span> — {task.status}</span>
            <button
              onClick={() => updateTaskStatus(task.id, 'DONE')}
              disabled={task.status === 'DONE'}
            >
              Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

# Service Class Patterns

## Original code (rewritten for case)

```php
<?php
// UserService.php
class UserService
{
    public function __construct(
        private EntityManagerInterface $em
    ) {}

    public function createUser(array $data): User
    {
        $user = new User();
        $user->setEmail($data['email']);
        $user->setFirstName($data['firstName']);
        $user->setLastName($data['lastName']);
        $user->setRole($data['role']);
        $user->setStatus('PENDING');
        $user->setCreatedAt(new \DateTime());

        $this->em->persist($user);
        $this->em->flush();

        // Send welcome email
        $mailer = new \Swift_Mailer(new \Swift_SmtpTransport('smtp.example.com', 587));
        $message = (new \Swift_Message('Welcome!'))
            ->setFrom('noreply@scout.com')
            ->setTo($user->getEmail())
            ->setBody("Welcome {$user->getFirstName()}!");
        $mailer->send($message);

        // Log to file
        file_put_contents('/var/log/users.log', "Created user: {$user->getEmail()}\n", FILE_APPEND);

        // Update external CRM
        $ch = curl_init('https://crm.example.com/api/contacts');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'email' => $user->getEmail(),
            'name' => $user->getFullName()
        ]));
        curl_exec($ch);
        curl_close($ch);

        return $user;
    }
}
```

## What SOLID principles does this violate?

1. Single Responsibility - this method does a user create, a message send, a log and CRM update.
2. All the things above should be done with an abstraction, a dedicated service for each, and many values should not be hardcoded
3.

## What will happen if the CRM API is slow or down?

If the curl_exec() is slow, it could lead to a timeout or other performance issues downstream since this method doesnt return until afterwards. If the curl_exec() fails, as long as it fails quickly, it should just return a false and then go on to return $user.

## How would you refactor this for better maintainability and reliability?

I would create Interfaces for the CRM, logger and mailer, and use DI to inject them into the class's constructor, then call them with proper data. I would add error handling as well, since I presume we want the CRM to be sync'd to whatever this app's concept of a user is. Probably use a queue with retry and dead letter queue configured. I would also use .env or some other secure method to store the hardcoded items and allow for better abstraction of underlying services (like maybe if you want to swap SwiftMailer for something else, like Symfony's built in Mailer - which I recomend, or swap this low level file write with a real MonoLog). I would probably also use Guzzle or Symfony's HttpClient instead of curl, to have better management of the process - errors, setting headers, easily injected etc.