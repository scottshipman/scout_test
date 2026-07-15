<?php

namespace App\Exception;

class UserNotFoundException extends \RuntimeException
{
    public function __construct(string $id)
    {
        parent::__construct(sprintf('User with id "%s" was not found.', $id));
    }
}
