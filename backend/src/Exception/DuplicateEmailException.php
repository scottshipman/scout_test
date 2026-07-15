<?php

namespace App\Exception;

class DuplicateEmailException extends \RuntimeException
{
    public function __construct(string $email)
    {
        parent::__construct(sprintf('A user with email "%s" already exists.', $email));
    }
}
