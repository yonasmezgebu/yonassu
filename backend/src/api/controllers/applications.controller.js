const { db } = require('../../config/database');
const { sendApplicationEmail } = require('../../services/email.service');
const { sendNotification } = require('../../services/notification.service');

exports.submitApplication = async (req, res) => {
  try {
    const { post_id, full_name, phone_number, email, education_status, national_id, sex } = req.body;

    if (!post_id || !full_name || !phone_number || !email || !education_status || !national_id || !sex) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [id] = await db('job_applications').insert({
      post_id,
      full_name,
      phone_number,
      email,
      education_status,
      national_id,
      sex,
      status: 'PENDING'
    }).returning('id');

    const insertedId = id.id || id;

    // Fetch post details for the email and notification
    const post = await db('news_posts').where({ id: post_id }).first();
    const positionName = post?.hiring_position || post?.title || 'Open Position';

    // Notify HR
    sendNotification('HR Manager', null, {
      title: 'New Job Application',
      message: `${full_name} applied for ${positionName}`,
      type: 'job_application',
      link: '/hr/applications',
      related_entity_id: insertedId
    }).catch(err => console.error('[Notification] Failed to notify HR:', err.message));

    // Send Gmail confirmation email to applicant (non-blocking — don't fail if email errors)
    sendApplicationEmail({
      applicantName: full_name,
      applicantEmail: email,
      position: positionName,
      location: post?.hiring_location || '',
    }).catch(err => console.error('[Email] Failed to send application email:', err.message));

    console.log(`[Job Application] New application from ${full_name} (${email}) for post ${post_id}`);

    res.status(201).json({ success: true, message: 'Application submitted successfully', id: insertedId });
  } catch (err) {
    console.error('Submit application error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getApplications = async (req, res) => {
  try {
    const applications = await db('job_applications')
      .join('news_posts', 'job_applications.post_id', 'news_posts.id')
      .select('job_applications.*', 'news_posts.title as post_title')
      .orderBy('job_applications.created_at', 'desc');
      
    res.json(applications);
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'IN_PERSON_INVITED', 'SUBMITTED_TO_CEO', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db('job_applications').where({ id }).update({ status, updated_at: db.fn.now() });

    // If forwarded to CEO, send a notification to the CEO
    if (status === 'SUBMITTED_TO_CEO') {
      const appInfo = await db('job_applications')
        .join('news_posts', 'job_applications.post_id', 'news_posts.id')
        .where('job_applications.id', id)
        .select('job_applications.full_name', 'news_posts.hiring_position', 'news_posts.title')
        .first();

      if (appInfo) {
        const positionName = appInfo.hiring_position || appInfo.title || 'Open Position';
        sendNotification('CEO', null, {
          title: 'Candidate Shortlisted',
          message: `HR forwarded applicant ${appInfo.full_name} for ${positionName}`,
          type: 'job_application_forwarded',
          link: '/ceo/applicants', // Route to CEO Applicants
          related_entity_id: id
        }).catch(err => console.error('[Notification] Failed to notify CEO:', err.message));
      }
    }
    
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
