<?php

namespace App\Controller;

use App\Document\User;
use App\Service\UserService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

// Keeping this thin on purpose - no try/catch here, errors get handled
// by ApiExceptionSubscriber instead.
#[Route('/api/users')]
class UserController
{
    public function __construct(
        private readonly UserService $userService,
    ) {
    }

    #[Route('', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', 10);

        $result = $this->userService->listUsers($page, $limit);

        return new JsonResponse([
            'data' => array_map(static fn (User $user) => $user->toArray(), $result['items']),
            'meta' => $result['meta'],
        ]);
    }

    // Passing the raw id string in and letting the service look it up,
    // rather than auto-fetching the User here.
    #[Route('/{id}', methods: ['GET'])]
    public function get(string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);

        return new JsonResponse(['data' => $user->toArray()]);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = $this->decode($request);
        $user = $this->userService->createUser($payload);

        return new JsonResponse(['data' => $user->toArray()], 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(string $id, Request $request): JsonResponse
    {
        $payload = $this->decode($request);
        $user = $this->userService->updateUser($id, $payload);

        return new JsonResponse(['data' => $user->toArray()]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $this->userService->deleteUser($id);

        return new JsonResponse(null, 204);
    }

    // Just turning the body into a plain array here - the DTOs do the
    // actual field-by-field parsing. Bad JSON just becomes an empty array.
    private function decode(Request $request): array
    {
        $content = $request->getContent();
        if ($content === '') {
            return [];
        }

        $data = json_decode($content, true);

        return is_array($data) ? $data : [];
    }
}
