module.exports =
'<h1>Login to Outbrain:</h1> \
<form  action="/outbrain_login" method="post"> \
	<input type="hidden" name="submitted" value="true"> \
  <input type="hidden" name="csrf" value={{csrf}} > \
  <div class="form-focus login-fields"> \
    <fieldset class="normal-field"> \
      <label for="signin-member-username"> \
       Username or Email \
      </label><input id="signin-member-username" name="loginUsername" type="text" class="input-text" value=""> \
    </fieldset> \
    <fieldset class="normal-field"> \
      <label for="signin-member-password">Password</label> \
      <input id="signin-member-password" name="loginPassword" type="password" class="input-text" value=""> \
    </fieldset> \
    <input type="checkbox" name="rememberMe" value="true" id="signin-member-remember" class="input-check"> \
    <input type="hidden" id="__checkbox_signin-member-remember" name="__checkbox_rememberMe" value="true"> \
    <div class="alt"> \
      <input id="loginButton" width="77" type="image" height="30" class="btn-small" alt="Login" src="https://u.outbrain.com/ver_214/img/btn-txt-login.png"> \
    </div> \
  </div> \
</form>';
