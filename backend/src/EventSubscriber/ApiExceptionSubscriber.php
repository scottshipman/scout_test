<?php

namespace App\EventSubscriber;

use App\Exception\DuplicateEmailException;
use App\Exception\UserNotFoundException;
use App\Exception\ValidationException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ApiExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onKernelException',
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $throwable = $event->getThrowable();

        $response = match (true) {
            $throwable instanceof ValidationException => new JsonResponse(
                ['message' => 'Validation failed.', 'errors' => $throwable->getErrors()],
                422
            ),
            $throwable instanceof UserNotFoundException => new JsonResponse(
                ['message' => $throwable->getMessage()],
                404
            ),
            $throwable instanceof DuplicateEmailException => new JsonResponse(
                ['message' => $throwable->getMessage()],
                409
            ),
            $throwable instanceof \InvalidArgumentException => new JsonResponse(
                ['message' => 'Invalid request.'],
                400
            ),
            default => null,
        };

        if ($response !== null) {
            $event->setResponse($response);
        }
    }
}
